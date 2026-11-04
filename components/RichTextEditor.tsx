'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { 
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
  }
)

// Import Quill styles
import 'react-quill-new/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = ""
}: RichTextEditorProps) {

  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, 
       { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
    clipboard: {
      // toggle to add extra line breaks when pasting HTML:
      matchVisual: false,
    }
  }), [])

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'indent',
    'align',
    'link', 'image', 'video',
    'code-block'
  ]

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .ql-editor {
          min-height: 300px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        
        .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .ql-toolbar.ql-snow {
          background: #f9fafb;
        }
        
        .ql-editor:focus {
          outline: none;
        }
        
        .ql-container.ql-snow {
          border-color: #d1d5db;
        }
        
        .ql-toolbar.ql-snow {
          border-color: #d1d5db;
        }
        
        .rich-text-editor:focus-within .ql-container.ql-snow {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
        }
        
        .rich-text-editor:focus-within .ql-toolbar.ql-snow {
          border-color: #8b5cf6;
        }

        /* Custom styles for better visual appearance */
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .ql-editor p {
          margin-bottom: 1em;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #8b5cf6;
          padding-left: 1em;
          margin: 1em 0;
          background: #f8fafc;
        }
        
        .ql-editor code {
          background: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        }
        
        .ql-editor pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
      `}</style>
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}
