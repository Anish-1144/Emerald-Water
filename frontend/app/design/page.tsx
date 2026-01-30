'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useDesignStore as useDesignDataStore, useCartStore } from '@/lib/store';
import { useDesignStore } from '@/store/useDesignStore';
import { useLabelEditorStore } from '@/store/useLabelEditorStore';
import { designAPI } from '@/lib/api';
import Bottle3D from '@/components/Bottle3D';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import DesignPanel from '@/components/DesignPanel';
import ImageCropModal from '@/components/ui/ImageCropModal';

export default function DesignPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { currentDesign, setCurrentDesign } = useDesignDataStore();
  const { capColor, setCapColor, labelTexture, setLabelTexture } = useDesignStore();
  const { addToCart, items: cartItems } = useCartStore();
  const { exportCanvas: exportLabelCanvas, elements: labelEditorElements } = useLabelEditorStore();
  const [activeTab, setActiveTab] = useState<string | null>('label-design');
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

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, token, router]);

  const generateLabelImage = async (): Promise<string> => {
    // Priority 1: If user uploaded a direct image (from Upload tab) and label editor is empty, use the uploaded image
    const hasLabelEditorElements = labelEditorElements && labelEditorElements.length > 0;
    
    if (labelData.image && !hasLabelEditorElements) {
      // User uploaded a pre-built label image - use it directly
      setLabelTexture(labelData.image);
      return labelData.image;
    }

    // Priority 2: If label editor has elements, use the editor export
    if (hasLabelEditorElements) {
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

    canvas.width = 2048; // Match label editor canvas size
    canvas.height = 1024;

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
    setLabelData({ ...labelData, image: croppedImage });
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

      // Determine design source type
      const hasLabelEditorElements = labelEditorElements && labelEditorElements.length > 0;
      const hasUploadedImage = labelData.image && !hasLabelEditorElements;
      const hasDesignedLabel = hasLabelEditorElements;
      const designSource = hasUploadedImage ? 'uploaded' : hasDesignedLabel ? 'designed' : 'legacy';

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
      
      alert('Design saved successfully!');
    } catch (error: any) {
      alert('Error saving design: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculatePrice = (quantity: number): number => {
    // Base price calculation: $2 per bottle for 100+, $1.5 for 500+, $1 for 1000+
    if (quantity >= 1000) return quantity * 1;
    if (quantity >= 500) return quantity * 1.5;
    return quantity * 2;
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
        // Add to cart with the design
        addToCart({
          design_id: designToAdd._id,
          design: designToAdd,
          quantity: 100,
          price: calculatePrice(100),
        });
        
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

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-[#1E1E1E]">
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
          />
        )}
        
        {/* Show 3D model only when Cart, Ticket, or Edit Profile is NOT active */}
        {activeTab !== 'cart' && activeTab !== 'ticket' && activeTab !== 'edit-profile' && (
          <main className={`flex-1 overflow-hidden ${activeTab ? 'w-[65%]' : 'w-full'}`}>
            <div className="h-full bg-[#1E1E1E]">
              <Bottle3D />
            </div>
          </main>
        )}
      </div>

      <Footer onAddToCart={handleAddToCart} />
      
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
