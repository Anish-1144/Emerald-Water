'use client';

import { useState } from 'react';
import { Package, Download, Calendar, MapPin, User, Building, Mail, Phone, RotateCw } from 'lucide-react';
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

  return (
    <div className="p-8" style={{ backgroundColor: '#ededed' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order ID Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
              <p className="text-sm text-gray-600 mt-1">{order.order_id}</p>
            </div>
            {/* ORDER INFORMATION */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">ORDER INFORMATION</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quantity</p>
                  <p className="font-semibold text-gray-800">{order.quantity} Bottles</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Price</p>
                  <p className="font-semibold text-gray-800">${order.total_price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <p className="font-semibold text-gray-800 capitalize">{order.payment_status || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(order.createdAt || order.created_at)}</p>
                </div>
              </div>
            </div>

            {/* SHIPPING ADDRESS */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800">SHIPPING ADDRESS</h2>
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
                      <p className="text-gray-800">{order.shipping_address.full_name}</p>
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
            )}

            {/* Colour */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Colour</h2>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: capColor }}
                />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Colour Name</p>
                  <p className="font-semibold text-gray-800 mb-2">{getColorName(capColor)}</p>
                  <p className="text-sm text-gray-600 mb-1">Hex Code</p>
                  <p className="font-mono text-sm text-gray-800">{capColor.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* LABEL */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">LABEL</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-green-600"
                    title="Zoom In"
                  >
                    <span className="text-lg font-bold">+</span>
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors text-green-600"
                    title="Zoom Out"
                  >
                    <span className="text-lg font-bold">−</span>
                  </button>
                </div>
              </div>
              {order.label_image ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white relative">
                  <div 
                    className="flex items-center justify-center p-4"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      minHeight: '192px'
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
              ) : (
                <p className="text-sm text-center text-gray-500 py-8">No label image</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Update Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Update Status</h3>
              <div className="relative mb-3">
                <select
                  value={order.order_status}
                  onChange={handleStatusChange}
                  disabled={updating}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 bg-white text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="pending_production">Pending Production</option>
                  <option value="printing">Printing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.order_status)}`}>
                  {order.order_status === 'pending_production' ? 'Pending' : order.order_status?.replace('_', ' ') || 'Pending'}
                </span>
              </div>
              {updating && (
                <p className="text-sm text-gray-500 mt-2">Updating...</p>
              )}
            </div>

            {/* Download Files */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Download Files</h3>
              {order.print_pdf ? (
                <a
                  href={order.print_pdf}
                  download
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Print PDF</span>
                </a>
              ) : (
                <p className="text-sm text-gray-500">No PDF available</p>
              )}
            </div>

            {/* DESIGN PREVIEW */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">DESIGN PREVIEW</h3>
                <div className="flex items-center gap-1 text-gray-600">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-sm font-semibold">360°</span>
                </div>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg min-h-[600px] flex items-center justify-center relative">
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
                    {/* <BottleMultiAngleView 
                      labelImage={order.label_image}
                      capColor={capColor}
                      height="600px"
                      showInstructions={false}
                    /> */}
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
