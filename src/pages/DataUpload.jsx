import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { dataAPI } from '../utils/api'
import DataUpload from '../components/DataUpload'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DataUploadPage = () => {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFilePreview = async (file) => {
    setLoading(true)
    try {
      const response = await dataAPI.preview(file)
      setPreviewData(response.data)
      setSelectedFile(file)
      toast.success('Data preview loaded successfully')
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to preview data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUseData = () => {
    if (!selectedFile || !previewData) {
      toast.error('Please select and preview a data file first')
      return
    }

    // Read the selected file as a data URL and store it together with the preview
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const fileDataUrl = reader.result
        sessionStorage.setItem('uploadedDataFile', JSON.stringify({
          file: {
            name: selectedFile.name,
            type: selectedFile.type,
            dataUrl: fileDataUrl
          },
          preview: previewData
        }))

        // Notify other parts of the SPA (same tab) that uploaded data changed
        try {
          window.dispatchEvent(new Event('uploadedDataFileUpdated'))
        } catch (e) {
          // ignore
        }

        navigate(`/designer/${templateId}?step=mapping`)
      } catch (err) {
        toast.error('Failed to store uploaded file')
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read the selected file')
    }
    reader.readAsDataURL(selectedFile)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/designer/${templateId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Designer</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-600 mt-2">
          Upload your CSV or Excel file containing the data for ID card generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Data Upload */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upload Data File</h2>
              <p className="card-description">
                Upload a CSV or Excel file with your student/employee data
              </p>
            </div>
            
            <div className="card-content">
              <DataUpload
                onUpload={handleUseData}
                onPreview={handleFilePreview}
                loading={loading}
              />
            </div>
          </div>

          {/* Data Preview */}
          {previewData && (
            <div className="card mt-6">
              <div className="card-header">
                <h2 className="card-title flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Data Preview</span>
                </h2>
                <p className="card-description">
                  Preview of your uploaded data ({previewData.total_rows} total rows)
                </p>
              </div>
              
              <div className="card-content">
                {/* Columns */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Available Columns ({previewData.columns.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {previewData.columns.map((column, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample Data */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Sample Data (First 5 rows)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewData.columns.map((column, index) => (
                            <th
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.sample_data.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {previewData.columns.map((column, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {row[column] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Data Format Guidelines</h2>
            </div>
            
            <div className="card-content space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Supported Formats</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSV files (.csv)</li>
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Common Columns</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• name (Full Name)</li>
                  <li>• roll_no / employee_id</li>
                  <li>• email</li>
                  <li>• phone</li>
                  <li>• department</li>
                  <li>• photo (URL or file path)</li>
                  <li>• designation</li>
                  <li>• batch / joining_date</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Tip</p>
                    <p className="text-sm text-blue-700">
                      Make sure your column names match the field names you'll use in the template designer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {previewData && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Ready to Continue?</h2>
              </div>
              
              <div className="card-content">
                <p className="text-sm text-gray-600 mb-4">
                  Your data file is ready. Click below to proceed to the template designer where you can map fields to your template.
                </p>
                
                <button
                  onClick={handleUseData}
                  className="w-full btn-primary"
                >
                  Continue to Designer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataUploadPage