const PreviewCard = ({ template, fieldMappings = [], sampleData = {} }) => {
  if (!template) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">No template available for preview</p>
      </div>
    )
  }

  // Calculate scale to fit preview container
  const containerWidth = 300
  const containerHeight = 200
  const scaleX = containerWidth / template.template_width
  const scaleY = containerHeight / template.template_height
  const scale = Math.min(scaleX, scaleY, 1)

  const previewWidth = template.template_width * scale
  const previewHeight = template.template_height * scale

  // Helper to resolve sample value with tolerant key matching
  const resolveSampleValue = (fieldName) => {
    if (!sampleData) return ''
    if (fieldName in sampleData) return sampleData[fieldName]
    const lc = fieldName.toLowerCase().replace(/_|\s+/g, '')
    for (const k of Object.keys(sampleData)) {
      if (k.toLowerCase().replace(/_|\s+/g, '') === lc) return sampleData[k]
    }
    return ''
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
      
      <div className="flex justify-center">
        <div
          className="relative bg-white shadow-md"
          style={{
            width: previewWidth,
            height: previewHeight,
          }}
        >
          {/* Template Image */}
          <img
            src={template.template_url}
            alt="Template preview"
            className="absolute inset-0 w-full h-full object-cover rounded"
            draggable={false}
          />

          {/* Field Values */}
          {fieldMappings.map((field, index) => {
            const value = resolveSampleValue(field.field_name) || field.field_name
            
            return (
              <div
                key={index}
                className="absolute flex items-center"
                style={{
                  left: field.x * scale,
                  top: field.y * scale,
                  width: field.width * scale,
                  height: field.height * scale,
                  fontSize: Math.max(6, field.font_size * scale * 0.8),
                  color: field.font_color || '#000000',
                  textAlign: field.alignment || 'left',
                }}
              >
                {field.field_name.toLowerCase() === 'photo' ? (
                  <div className="w-full h-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
                    Photo
                  </div>
                ) : (
                  <span className="w-full truncate" style={{ lineHeight: 1 }}>
                    {value}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sample Data Display */}
      {Object.keys(sampleData).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Sample Data:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {Object.entries(sampleData).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="truncate ml-2 max-w-32">{value}</span>
              </div>
            ))}
            {Object.keys(sampleData).length > 3 && (
              <div className="text-gray-500 italic">
                +{Object.keys(sampleData).length - 3} more fields
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewCard