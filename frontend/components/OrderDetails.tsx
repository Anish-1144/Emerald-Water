'use client';

import { useState } from 'react';
import { Package, Download, Calendar, MapPin, User, Building, Mail, Phone } from 'lucide-react';
import BottleMultiAngleView from './BottleMultiAngleView';

interface OrderDetailsProps {
  order: any;
  onStatusUpdate: (orderId: string, status: string) => void;
  loading?: boolean;
}

export default function OrderDetails({ order, onStatusUpdate, loading }: OrderDetailsProps) {
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_production':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'printing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'shipped':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-lg" style={{ color: 'var(--text-primary)' }}>Loading order details...</div>
      </div>
    );
  }

  // Get cap color from order
  const capColor = order.design_id?.design_json?.capColor || order.design_id?.capColor || '#ffffff';
  
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
      '#a52a2a': 'Brown',
      '#ffc0cb': 'Pink',
    };
    
    const normalizedHex = hex.toLowerCase();
    return colorMap[normalizedHex] || 'Custom';
  };

  return (
    <div className="p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Order Details
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {order.order_id}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 ${getStatusColor(order.order_status)}`}>
              <span className="font-semibold capitalize">
                {order.order_status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Order Information and Actions - Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Package className="w-5 h-5" />
                Order Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Quantity</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {order.quantity} bottles
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Price</p>
                  <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    ${order.total_price?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Payment Status</p>
                  <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {order.payment_status}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Order Date</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="space-y-2">
                  {order.shipping_address.company_name && (
                    <div className="flex items-start gap-2">
                      <Building className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {order.shipping_address.company_name}
                      </p>
                    </div>
                  )}
                  {order.shipping_address.full_name && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-primary)' }}>
                        {order.shipping_address.full_name}
                      </p>
                    </div>
                  )}
                  {order.shipping_address.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-primary)' }}>
                        {order.shipping_address.email}
                      </p>
                    </div>
                  )}
                  {order.shipping_address.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-primary)' }}>
                        {order.shipping_address.phone}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {order.shipping_address.address1}
                    </p>
                    {order.shipping_address.address2 && (
                      <p style={{ color: 'var(--text-primary)' }}>
                        {order.shipping_address.address2}
                      </p>
                    )}
                    <p style={{ color: 'var(--text-primary)' }}>
                      {order.shipping_address.city}, {order.shipping_address.zip}
                    </p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {order.shipping_address.country}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Update Status
              </h3>
              <select
                value={order.order_status}
                onChange={handleStatusChange}
                disabled={updating}
                className="w-full px-4 py-2 rounded-lg border mb-4"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="pending_production">Pending Production</option>
                <option value="printing">Printing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {updating && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Updating...</p>
              )}
            </div>

            {/* Download Files */}
            {order.print_pdf && (
              <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Download Files
                </h3>
                <a
                  href={order.print_pdf}
                  download
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#4DB64F',
                    color: 'white',
                  }}
                >
                  <Download className="w-5 h-5" />
                  <span>Download Print PDF</span>
                </a>
              </div>
            )}

            {/* Order Timeline */}
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Order Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Order Created
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 mt-1" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Last Updated
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Design Preview - Side by Side Layout */}
        <div className="mb-6 p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Design Preview
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Two Stacked Sections */}
            <div className="lg:col-span-1 space-y-4">
              {/* Top: Cap Color */}
              <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-full border-2 flex-shrink-0"
                    style={{ 
                      backgroundColor: capColor,
                      borderColor: 'var(--border-color)'
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>colour</p>
                    <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                      {getColorName(capColor)}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {capColor.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Label */}
              <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium mb-3 text-center" style={{ color: 'var(--text-muted)' }}>label</p>
                {order.label_image ? (
                  <img
                    src={order.label_image}
                    alt="Label design"
                    className="w-full rounded-lg border"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                ) : (
                  <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No label image</p>
                )}
              </div>
            </div>

            {/* Right Column - 3D Model (Full Height) */}
            <div className="lg:col-span-2 p-4 rounded-lg border" style={{ 
              borderColor: 'var(--border-color)',
              borderWidth: '2px'
            }}>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>3D model</p>
              {order.label_image ? (
                <BottleMultiAngleView 
                  labelImage={order.label_image}
                  capColor={capColor}
                  height="600px"
                  showInstructions={true}
                />
              ) : order.bottle_snapshot ? (
                <div className="flex justify-center">
                  <img
                    src={order.bottle_snapshot}
                    alt="Bottle preview"
                    className="w-full max-w-2xl rounded-lg border shadow-lg"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
              ) : (
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No bottle preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

