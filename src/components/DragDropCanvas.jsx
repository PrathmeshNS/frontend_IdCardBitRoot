import { useDndMonitor, useDroppable, useDraggable } from '@dnd-kit/core'
import { useState, useRef, useEffect } from 'react'

// Draggable Field Overlay Component
const DraggableFieldOverlay = ({ field, scale, onDoubleClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: { fieldName: field.field_name, isExisting: true }
  })

  const style = {
    left: field.x * scale,
    top: field.y * scale,
    width: field.width * scale,
    height: field.height * scale,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute bg-primary-500 bg-opacity-20 border-2 border-primary-500 cursor-move group hover:bg-opacity-30 transition-colors"
      style={style}
      onDoubleClick={() => onDoubleClick(field.id)}
      title={`${field.field_name} (double-click to edit)`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="text-primary-700 font-medium text-xs bg-white bg-opacity-90 px-1 rounded truncate max-w-full"
          style={{ fontSize: Math.max(8, field.font_size * scale * 0.7) }}
        >
          {field.field_name}
        </span>
      </div>

      {/* Resize handles */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 border border-white opacity-0 group-hover:opacity-100 cursor-se-resize"></div>
    </div>
  )
}

const DragDropCanvas = ({ 
  template, 
  fieldMappings = [], 
  onFieldUpdate, 
  onFieldAdd,
  availableFields = [],
  className = ""
}) => {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas'
  })

  // Calculate canvas size and scale
  useEffect(() => {
    const calculateSize = () => {
      if (template && containerRef.current) {
        const container = containerRef.current
        const containerWidth = container.clientWidth - 40 // Account for padding
        const containerHeight = container.clientHeight - 40

        const scaleX = containerWidth / template.template_width
        const scaleY = containerHeight / template.template_height
        const newScale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond 100%

        setScale(newScale)
        setCanvasSize({
          width: template.template_width * newScale,
          height: template.template_height * newScale
        })
      }
    }

    calculateSize()
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateSize)
    return () => window.removeEventListener('resize', calculateSize)
  }, [template])

  useDndMonitor({
    onDragStart: (event) => {
      console.log('Drag started:', event.active.id, event.active.data.current)
    },
    onDragEnd: (event) => {
      const { active, over, delta } = event
      console.log('Drag ended:', { activeId: active.id, overId: over?.id, delta })
      
      if (over && over.id === 'canvas') {
        const canvasRect = canvasRef.current?.getBoundingClientRect()
        if (!canvasRect || !template) {
          console.log('Missing canvas rect or template')
          return
        }

        // Calculate final drop position relative to canvas
        const finalX = event.activatorEvent.clientX + delta.x
        const finalY = event.activatorEvent.clientY + delta.y
        
        const x = (finalX - canvasRect.left) / scale
        const y = (finalY - canvasRect.top) / scale
        
        console.log('Position calculation:', { finalX, finalY, canvasLeft: canvasRect.left, canvasTop: canvasRect.top, scale, x, y })
        
        // Ensure the field stays within canvas bounds
        const clampedX = Math.max(0, Math.min(x, template.template_width - 100))
        const clampedY = Math.max(0, Math.min(y, template.template_height - 20))

        // Check if this is a new field or existing field
        const isExistingField = active.data.current?.isExisting
        
        if (isExistingField) {
          // Update existing field position
          console.log('Updating existing field:', active.id, { x: clampedX, y: clampedY })
          if (onFieldUpdate) {
            onFieldUpdate(active.id, { x: clampedX, y: clampedY })
          }
        } else {
          // Add new field
          const fieldName = active.data.current?.fieldName
          console.log('Adding new field:', fieldName, { x: clampedX, y: clampedY })
          if (fieldName && onFieldAdd) {
            onFieldAdd({
              field_name: fieldName,
              x: clampedX,
              y: clampedY,
              width: 100,
              height: 20,
              font_size: 12,
              font_color: '#000000',
              alignment: 'left'
            })
          }
        }
      }
    }
  })

  const handleFieldDoubleClick = (fieldId) => {
    // Open field properties dialog
    const field = fieldMappings.find(f => f.id === fieldId)
    if (field) {
      // This would typically open a modal for editing field properties
      console.log('Edit field:', field)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-100 rounded-lg border-2 border-dashed overflow-hidden ${
        isOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
      } ${className}`}
      style={{ minHeight: '500px' }}
    >
      {template ? (
        <div className="w-full h-full flex justify-center items-center p-5">
          <div
            ref={setNodeRef}
            className="relative bg-white shadow-lg"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            {/* Template Image */}
            <img
              ref={canvasRef}
              src={template.template_url}
              alt="Template"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* Field Overlays */}
            {fieldMappings.map((field) => (
              <DraggableFieldOverlay
                key={field.id}
                field={field}
                scale={scale}
                onDoubleClick={handleFieldDoubleClick}
              />
            ))}

            {/* Drop indicator */}
            {isOver && (
              <div className="absolute inset-0 bg-primary-500 bg-opacity-10 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-sm text-primary-600 font-medium">Drop field here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-lg font-medium">No template selected</p>
            <p className="text-sm">Upload a template to start designing</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DragDropCanvas