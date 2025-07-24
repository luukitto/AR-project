import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';

export default function TableManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    isActive: true
  });

  const { 
    tables, 
    loading, 
    fetchTables, 
    createTable, 
    updateTable, 
    deleteTable 
  } = useAdminStore();

  useEffect(() => {
    fetchTables().catch(console.error);
  }, [fetchTables]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tableData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingTable) {
        await updateTable(editingTable.id, tableData);
      } else {
        await createTable(tableData);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      alert('Error saving table: ' + error.message);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.table_number,
      capacity: table.capacity,
      isActive: table.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this table?')) {
      try {
        await deleteTable(id);
      } catch (error) {
        alert('Error deleting table: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      capacity: 4,
      isActive: true
    });
    setEditingTable(null);
  };

  const handleNewTable = () => {
    resetForm();
    setShowModal(true);
  };

  const generateQRCode = (table) => {
    const qrUrl = `${window.location.origin}/table/${table.qr_code}`;
    navigator.clipboard.writeText(qrUrl);
    alert(`Table ${table.table_number} QR URL copied to clipboard!\n\nCustomers can scan this QR code or visit:\n${qrUrl}`);
  };

  const printQRCode = (table) => {
    const qrUrl = `${window.location.origin}/table/${table.qr_code}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${table.table_number} QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
            .qr-container { border: 2px solid #000; padding: 20px; margin: 20px auto; max-width: 300px; }
            .table-info { margin-bottom: 20px; }
            .qr-placeholder { width: 200px; height: 200px; border: 2px dashed #ccc; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #666; }
            .url { font-family: monospace; font-size: 12px; word-break: break-all; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="table-info">
              <h2>Table ${table.table_number}</h2>
              <p>Capacity: ${table.capacity} people</p>
            </div>
            <div class="qr-placeholder">
              QR Code Here<br/>
              (Use QR generator with URL below)
            </div>
            <div class="url">${qrUrl}</div>
            <p style="font-size: 12px; margin-top: 20px;">Scan to join table and start ordering</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading.tables) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Table Management</h2>
        <button
          onClick={handleNewTable}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Table
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-amber-600 font-bold text-lg">
                    {table.table_number}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Table {table.table_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Capacity: {table.capacity} people
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  table.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Table Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Sessions:</span>
                <span className="font-medium text-gray-900">
                  {table.active_sessions_count || 0}
                </span>
              </div>
              {table.last_session_time && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Last Used:</span>
                  <span className="text-gray-500">
                    {new Date(table.last_session_time).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-700">QR Code URL</p>
                <p className="text-xs text-gray-500 font-mono break-all">
                  {window.location.origin}/table/{table.qr_code}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateQRCode(table)}
                  className="flex-1 text-blue-600 hover:text-blue-800 text-xs font-medium py-1 px-2 bg-blue-50 rounded"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => printQRCode(table)}
                  className="flex-1 text-green-600 hover:text-green-800 text-xs font-medium py-1 px-2 bg-green-50 rounded"
                >
                  Print QR
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(table)}
                className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => printQRCode(table)}
                className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Print QR
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🪑</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first table</p>
          <button
            onClick={handleNewTable}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Table
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="e.g., T01, A1, Table 1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (people)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Table is active and available for use
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                >
                  {editingTable ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
