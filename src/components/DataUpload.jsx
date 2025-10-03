import { useState, useRef } from 'react'
import { Upload, X, FileText, Table } from 'lucide-react'
import { validateFileType, validateFileSize, formatFileSize } from '../utils/helpers'
import toast from 'react-hot-toast'

const DataUpload = ({ onUpload, onPreview, loading = false }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  const maxSize = 10 * 1024 * 1024 // 10MB

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file type
    if (!validateFileType(file, allowedTypes)) {
      toast.error('Please upload only CSV or Excel files')
      return
    }

    // Validate file size
    if (!validateFileSize(file, maxSize)) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Auto-preview the file
    if (onPreview) {
      onPreview(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    onUpload(selectedFile)
  }

  const getFileIcon = (file) => {
    if (file.type === 'text/csv') {
      return <FileText className="w-6 h-6 text-green-500" />
    }
    return <Table className="w-6 h-6 text-blue-500" />
  }

  const getFileTypeText = (file) => {
    if (file.type === 'text/csv') {
      return 'CSV File'
    }
    return 'Excel File'
  }

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={loading}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <Upload className="w-full h-full" />
            </div>
            <div>
              <p className="text-lg text-gray-600">
                <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">CSV or Excel files up to 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="relative bg-gray-50 rounded-lg p-4">
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getFileIcon(selectedFile)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {getFileTypeText(selectedFile)} • {formatFileSize(selectedFile.size)}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">File loaded successfully</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onPreview && (
              <button
                onClick={() => onPreview(selectedFile)}
                disabled={loading}
                className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Data
              </button>
            )}
            
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Use This Data'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataUpload