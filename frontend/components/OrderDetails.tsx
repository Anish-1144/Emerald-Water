'use client';

import { useState } from 'react';
import { Package, Download, Calendar, MapPin, User, Building, Mail, Phone, RotateCw, Eye } from 'lucide-react';
import BottleMultiAngleView from './BottleMultiAngleView';

interface OrderDetailsProps {
  order: any;
  onStatusUpdate: (orderId: string, status: string) => void;
  loading?: boolean;
}

export default function OrderDetails({ order, onStatusUpdate, loading }: OrderDetailsProps) {
  const [updating, setUpdating] = useState(false);
  const [labelZoom, setLabelZoom] = useState(100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-orange-100 text-orange-800';
      case 'printing':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await onStatusUpdate(order._id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen" style={{ backgroundColor: '#ededed' }}>
        <div className="text-lg text-gray-700">Loading order details...</div>
      </div>
    );
  }

  // Get cap color from order
  const capColor = order.design_id?.design_json?.capColor || order.design_id?.capColor || '#6226EF';
  
  // Function to get color name from hex
  const getColorName = (hex: string): string => {
    const colorMap: { [key: string]: string } = {
      '#ffffff': 'White',
      '#000000': 'Black',
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#808080': 'Gray',
      '#ffa500': 'Orange',
      '#800080': 'Purple',
      '#6226EF': 'Custom',
    };
    
    const normalizedHex = hex.toLowerCase();
    return colorMap[normalizedHex] || 'Custom';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleZoomIn = () => {
    setLabelZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setLabelZoom(prev => Math.max(prev - 10, 50));
  };

  const handleDownloadPDF = async () => {
    if (order.print_pdf) {
      // If PDF already exists, download it directly
      const link = document.createElement('a');
      link.href = order.print_pdf;
      link.download = `label-${order.order_id || 'label'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (order.label_image) {
      // Convert image to PDF using canvas and jsPDF approach
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = order.label_image;
        
        img.onload = () => {
          // Create a canvas to get image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to data URL
          const imgData = canvas.toDataURL('image/png');
          
          // Create a new window with the image and use browser's print to PDF
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Label PDF</title>
                  <style>
                    body { margin: 0; padding: 20px; }
                    img { max-width: 100%; height: auto; }
                  </style>
                </head>
                <body>
                  <img src="${imgData}" alt="Label" />
                </body>
              </html>
            `);
            printWindow.document.close();
            
            // Wait for image to load, then trigger print
            setTimeout(() => {
              printWindow.print();
            }, 250);
          } else {
            // Fallback: download image directly if popup blocked
            const link = document.createElement('a');
            link.href = order.label_image;
            link.download = `label-${order.order_id || 'label'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
        
        img.onerror = () => {
          // Fallback: download image directly
          const link = document.createElement('a');
          link.href = order.label_image;
          link.download = `label-${order.order_id || 'label'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      } catch (error) {
        console.error('Error downloading PDF:', error);
        // Fallback: download image directly
        const link = document.createElement('a');
        link.href = order.label_image;
        link.download = `label-${order.order_id || 'label'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="p-8" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Section Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
          <p className="text-sm text-gray-600 mt-1">{order.order_id}</p>
        </div>

        {/* TOP SECTION — 2 Column Grid (col-span-7 | col-span-3) */}
        <div className="grid grid-cols-10 gap-4">
          {/* LEFT PANEL — "Order Information" (col-span-7) */}
          <div className="col-span-10 lg:col-span-7">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">ORDER INFORMATION</h2>
              <div className="border-b border-gray-200 mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Quantity</p>
                  <p className="font-semibold text-gray-800">{order.quantity} Bottles</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Price</p>
                  <p className="font-semibold text-gray-800">${order.total_price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    order.payment_status === 'success' || order.payment_status === 'Success' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {order.payment_status || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(order.createdAt || order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — "Update Status + Download" (col-span-3) */}
          <div className="col-span-10 lg:col-span-3 space-y-4">
            {/* Update Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Update Status</h3>
                <div className="relative flex-1">
                  <select
                    value={order.order_status}
                    onChange={handleStatusChange}
                    disabled={updating}
                    className="w-full px-3 py-1.5 pr-8 rounded-full border border-orange-200 bg-orange-50 text-orange-600 font-medium text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    style={{
                      backgroundColor: '#fff7ed',
                      borderColor: '#fed7aa',
                      color: '#ea580c'
                    }}
                  >
                    <option value="pending_production">Pending</option>
                    <option value="printing">Processing</option>
                    <option value="packed">Processing</option>
                    <option value="shipped">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {updating && (
                <p className="text-xs text-gray-500 mt-1">Updating...</p>
              )}
            </div>

            {/* Download Files */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">Download Files</h3>
              {order.print_pdf ? (
                <a
                  href={order.print_pdf}
                  download
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-white font-semibold text-xs bg-green-500 hover:bg-green-600"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Print PDF</span>
                </a>
              ) : (
                <p className="text-xs text-gray-500 text-center">No PDF available</p>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION — 2 Column Grid (col-span-4 | col-span-6) */}
        <div className="grid grid-cols-10 gap-4">
          {/* LEFT COLUMN (col-span-4) */}
          <div className="col-span-10 lg:col-span-4 space-y-4">
            {/* Block 1 — "Shipping Address" */}
            {order.shipping_address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">SHIPPING ADDRESS</h2>
                <div className="space-y-3">
                  {order.shipping_address.company_name && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-800">{order.shipping_address.company_name}</p>
                    </div>
                  )}
                  {order.shipping_address.full_name && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-800 font-semibold">{order.shipping_address.full_name}</p>
                    </div>
                  )}
                  {order.shipping_address.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-800">{order.shipping_address.email}</p>
                    </div>
                  )}
                  {order.shipping_address.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-800">{order.shipping_address.phone}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="text-gray-800">
                        {order.shipping_address.address1}
                        {order.shipping_address.address2 && `, ${order.shipping_address.address2}`}
                        {order.shipping_address.city && `, ${order.shipping_address.city}`}
                        {order.shipping_address.zip && `, ${order.shipping_address.zip}`}
                        {order.shipping_address.country && ` ${order.shipping_address.country}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Block 2 — Color Swatch Row */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 shrink-0"
                  style={{ backgroundColor: capColor }}
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">Colour</p>
                  <p className="text-xs text-gray-500 mb-1">Cap Color</p>
                  <p className="text-xs text-gray-500 mb-2">{getColorName(capColor)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-gray-600">{capColor.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Block 3 — "Label" Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">LABEL</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
                    title="Zoom In"
                  >
                    <span className="text-lg font-bold">+</span>
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
                    title="Zoom Out"
                  >
                    <span className="text-lg font-bold">−</span>
                  </button>
                </div>
              </div>
              {order.label_image ? (
                <>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white relative mb-3">
                    <div 
                      className="flex items-center justify-center p-2"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        minHeight: '120px'
                      }}
                    >
                      <div
                        style={{ 
                          transform: `scale(${labelZoom / 100})`,
                          transformOrigin: 'center',
                          transition: 'transform 0.2s ease',
                          width: '672px',
                          height: '192px'
                        }}
                      >
                        <img
                          src={order.label_image}
                          alt="Label design"
                          style={{
                            width: '672px',
                            height: '192px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-white font-semibold text-xs bg-green-500 hover:bg-green-600"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download as PDF</span>
                    </button>
                    <button
                      onClick={() => window.open(order.label_image, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-700 font-semibold text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-center text-gray-500 py-4">No label image</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — "Design Preview" (col-span-6) */}
          <div className="col-span-10 lg:col-span-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">DESIGN PREVIEW</h3>
                <div className="flex items-center gap-1 text-gray-500">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs font-semibold">360°</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg min-h-[610px] flex items-center justify-center relative">
                {order.label_image ? (
                  <>
                    {(() => {
                      console.log('[OrderDetails] Rendering BottleMultiAngleView with label image:', {
                        hasLabelImage: !!order.label_image,
                        labelImageType: typeof order.label_image,
                        labelImagePreview: order.label_image.substring(0, 100),
                        labelImageLength: order.label_image.length,
                        capColor,
                        orderId: order.order_id || order._id
                      });
                      return null;
                    })()}
                    <BottleMultiAngleView 
                      labelImage={order.label_image}
                      capColor={capColor}
                      height="700px"
                      showInstructions={false}
                    />
                  </>
                ) : order.bottle_snapshot ? (
                  <img
                    src={order.bottle_snapshot}
                    alt="Bottle preview"
                    className="max-w-full max-h-[600px] rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">No design preview available</p>
                    <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
