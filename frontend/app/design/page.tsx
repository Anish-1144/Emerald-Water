'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDesignStore as useDesignDataStore, useCartStore } from '@/lib/store';
import { useDesignStore } from '@/store/useDesignStore';
import { useLabelEditorStore } from '@/store/useLabelEditorStore';
import { designAPI } from '@/lib/api';
import Bottle3D from '@/components/Bottle3D';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import DesignPanel from '@/components/DesignPanel';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { calculateOrderPrice, MINIMUM_BOTTLES, hexToCapColor, type CapColor } from '@/lib/pricing';

export default function DesignPage() {
  const router = useRouter();
  const { currentDesign, setCurrentDesign } = useDesignDataStore();
  const { capColor, setCapColor, labelTexture, setLabelTexture } = useDesignStore();
  const { addToCart, items: cartItems } = useCartStore();
  const { exportCanvas: exportLabelCanvas, elements: labelEditorElements } = useLabelEditorStore();
  const [activeTab, setActiveTab] = useState<string | null>('label-design');
  // Track the current design mode to ensure proper state management
  const [designMode, setDesignMode] = useState<'uploaded' | 'designed' | null>(null);

  // Check for pending tab from navigation (e.g., from orders page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingTab = sessionStorage.getItem('pendingTab');
      if (pendingTab) {
        setActiveTab(pendingTab);
        sessionStorage.removeItem('pendingTab');
      }
    }
  }, []);

  // Handle tab changes - reset state when switching tabs
  useEffect(() => {
    if (activeTab === 'upload') {
      // When switching to Upload tab: clear label editor elements and reset bottle to default
      const { elements } = useLabelEditorStore.getState();
      if (elements.length > 0) {
        useLabelEditorStore.setState({ 
          elements: [], 
          history: [], 
          historyIndex: -1,
          backgroundColor: '#ffffff'
        });
      }
      // Reset design mode
      setDesignMode(null);
      // Clear label texture to show default bottle
      setLabelTexture(null);
    } else if (activeTab === 'label-design') {
      // When switching to Label Design tab: clear uploaded image
      if (labelData.image) {
        setLabelData({ ...labelData, image: null });
      }
      // Reset design mode
      setDesignMode(null);
    }
  }, [activeTab]);
  const [labelData, setLabelData] = useState({
    text: '',
    fontSize: 24,
    fontFamily: 'Arial',
    textColor: '#000000',
    backgroundColor: '#ffffff',
    backgroundType: 'solid' as 'solid' | 'gradient',
    gradientStart: '#ffffff',
    gradientEnd: '#ffffff',
    image: null as string | null,
    imagePosition: { x: 0, y: 0 },
    imageSize: { width: 200, height: 200 },
    imageRotation: 0,
  });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auth is no longer required for design page

  const generateLabelImage = async (): Promise<string> => {
    // Get current state from store (not from closure)
    const currentElements = useLabelEditorStore.getState().elements;
    const hasLabelEditorElements = currentElements && currentElements.length > 0;
    
    // Priority 1: If design mode is 'designed' OR label editor has elements, use the editor export
    if (designMode === 'designed' || (hasLabelEditorElements && designMode !== 'uploaded')) {
      try {
        const exportedImage = await exportLabelCanvas();
        if (exportedImage) {
          setLabelTexture(exportedImage);
          return exportedImage;
        }
      } catch (error) {
        console.warn('Label editor export failed, using fallback', error);
      }
    }

    // Priority 2: If design mode is 'uploaded' OR user uploaded a direct image, use the uploaded image
    if (designMode === 'uploaded' || (labelData.image && !hasLabelEditorElements)) {
      // User uploaded a pre-built label image - use it directly
      if (labelData.image) {
        setLabelTexture(labelData.image);
        return labelData.image;
      }
    }

    // Priority 3: Fallback to old method (for legacy support)
    const canvas = canvasRef.current;
    if (!canvas) {
      // If no canvas and no image, return empty or use uploaded image
      if (labelData.image) {
        return labelData.image;
      }
      return '';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (labelData.image) {
        return labelData.image;
      }
      return '';
    }

    canvas.width = 2081; // Match label editor canvas size
    canvas.height = 544;

    // Draw background
    if (labelData.backgroundType === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, labelData.gradientStart);
      gradient.addColorStop(1, labelData.gradientEnd);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = labelData.backgroundColor || '#ffffff';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw uploaded image if exists (full canvas)
    if (labelData.image) {
      const imageSrc = labelData.image;
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Draw image to fill canvas (centered and scaled to fit)
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          resolve(null);
        };
        img.onerror = reject;
        img.src = imageSrc;
      });
    }

    // Draw text (only if no uploaded image or if explicitly set)
    if (labelData.text && !labelData.image) {
      ctx.fillStyle = labelData.textColor || '#000000';
      ctx.font = `${labelData.fontSize || 24}px ${labelData.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelData.text, canvas.width / 2, canvas.height / 2);
    }

    const imageData = canvas.toDataURL('image/png');
    setLabelTexture(imageData);
    return imageData;
  };

  const captureBottleSnapshot = async (): Promise<string> => {
    return generateLabelImage();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setImageToCrop(imageData);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedImage: string) => {
    // Clear label editor elements when user uploads an image
    // This ensures uploaded image takes priority over any existing label design
    const { elements } = useLabelEditorStore.getState();
    if (elements.length > 0) {
      // Clear all elements and reset background
      useLabelEditorStore.setState({ 
        elements: [], 
        history: [], 
        historyIndex: -1,
        backgroundColor: '#ffffff'
      });
    }
    
    // Set design mode to uploaded
    setDesignMode('uploaded');
    
    // Clear any previous design data and set uploaded image
    setLabelData({ 
      text: '',
      fontSize: 24,
      fontFamily: 'Arial',
      textColor: '#000000',
      backgroundColor: '#ffffff',
      backgroundType: 'solid' as 'solid' | 'gradient',
      gradientStart: '#ffffff',
      gradientEnd: '#ffffff',
      image: croppedImage,
      imagePosition: { x: 0, y: 0 },
      imageSize: { width: 200, height: 200 },
      imageRotation: 0,
    });
    setLabelTexture(croppedImage);
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      // Generate label image (handles both uploaded images and designed labels)
      const labelImage = await generateLabelImage();
      const bottleSnapshot = await captureBottleSnapshot();
      const printPdf = labelImage;

      // Determine design source type based on designMode or current state
      const currentElements = useLabelEditorStore.getState().elements;
      const hasLabelEditorElements = currentElements && currentElements.length > 0;
      
      // Use designMode if set, otherwise infer from current state
      let hasDesignedLabel = false;
      let hasUploadedImage = false;
      
      if (designMode === 'designed' || (hasLabelEditorElements && designMode !== 'uploaded')) {
        hasDesignedLabel = true;
      } else if (designMode === 'uploaded' || (labelData.image && !hasLabelEditorElements)) {
        hasUploadedImage = true;
      }
      
      const designSource = hasDesignedLabel ? 'designed' : hasUploadedImage ? 'uploaded' : 'legacy';

      const designData = {
        design_json: {
          labelData,
          capColor,
          designSource, // Track the source of the design
          hasUploadedImage,
          hasDesignedLabel,
        },
        label_image: labelImage,
        print_pdf: printPdf,
        bottle_snapshot: bottleSnapshot,
        is_draft: false,
        ...(currentDesign?._id && { design_id: currentDesign._id }),
      };

      const savedDesign = await designAPI.saveDesign(designData);
      setCurrentDesign(savedDesign);
      
      // Ensure labelTexture is updated in the store
      if (labelImage) {
        setLabelTexture(labelImage);
      }
    } catch (error: any) {
      alert('Error saving design: ' + error.message);
    } finally {
      setSaving(false);
    }
  };


  // Reset design state to default (fresh/newly)
  const resetDesignState = () => {
    // Clear label texture (reset 3D model to default)
    setLabelTexture(null);
    
    // Clear current design
    setCurrentDesign(null);
    
    // Clear label editor elements
    useLabelEditorStore.setState({ 
      elements: [], 
      history: [], 
      historyIndex: -1,
      backgroundColor: '#ffffff'
    });
    
    // Reset label data
    setLabelData({
      text: '',
      fontSize: 24,
      fontFamily: 'Arial',
      textColor: '#000000',
      backgroundColor: '#ffffff',
      backgroundType: 'solid' as 'solid' | 'gradient',
      gradientStart: '#ffffff',
      gradientEnd: '#ffffff',
      image: null,
      imagePosition: { x: 0, y: 0 },
      imageSize: { width: 200, height: 200 },
      imageRotation: 0,
    });
    
    // Reset design mode
    setDesignMode(null);
    
    // Reset cap color to default
    setCapColor('#ffffff');
  };

  const handleAddToCart = async () => {
    try {
      // Ensure design is saved first
      let designToAdd = currentDesign;
      
      if (!designToAdd) {
        // Save the design first
        await handleSaveDesign();
        // Get the updated design from the store after saving
        designToAdd = useDesignDataStore.getState().currentDesign;
      }
      
      if (designToAdd && designToAdd._id) {
        // Get cap color from design store and convert to CapColor type
        const capColorHex = capColor || '#ffffff';
        const capColorType: CapColor = hexToCapColor(capColorHex);
        
        // Calculate price with new pricing system
        const pricing = calculateOrderPrice({
          quantity: MINIMUM_BOTTLES,
          capColor: capColorType,
          shrinkWrap: false,
          shippingMethod: 'pickup',
          hasSetupFee: true, // First order includes setup fee
        });
        
        // Add to cart with the design (will be saved to localStorage automatically)
        addToCart({
          design_id: designToAdd._id,
          design: designToAdd,
          quantity: MINIMUM_BOTTLES,
          price: pricing.subtotal,
          capColor: capColorType,
          shrinkWrap: false,
        });
        
        // Reset 3D model to default (fresh/newly)
        resetDesignState();
        
        // Navigate to cart page
        router.push('/cart');
      } else {
        alert('Please save your design first before adding to cart.');
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert('Error adding design to cart: ' + (error.message || 'Please try again.'));
    }
  };

  return (
    <div className="flex flex-col h-screen transition-colors" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab && (
          <DesignPanel
            activeTab={activeTab}
            onClose={() => setActiveTab(null)}
            labelData={labelData}
            setLabelData={setLabelData}
            capColor={capColor}
            setCapColor={setCapColor}
            setLabelTexture={setLabelTexture}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            onImageUpload={handleImageUpload}
            fileInputRef={fileInputRef}
            onSaveDesign={handleSaveDesign}
            saving={saving}
            currentDesign={currentDesign}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
            onDesignModeChange={setDesignMode}
          />
        )}
        
        {/* Show 3D model only when Cart or Ticket is NOT active */}
        {activeTab !== 'cart' && activeTab !== 'ticket' && (
          <main className={`flex-1 overflow-hidden ${activeTab ? 'w-[65%]' : 'w-full'}`}>
            <div className="h-full bg-[#1E1E1E]">
              <Bottle3D />
            </div>
          </main>
        )}
      </div>

      {activeTab !== 'cart' && <Footer onAddToCart={handleAddToCart} />}
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onClose={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
