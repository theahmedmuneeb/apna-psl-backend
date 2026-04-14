"use client"

import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
})

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  modules?: {
    toolbar?: unknown
  }
  placeholder?: string
}

export function RichTextEditor(props: RichTextEditorProps) {
  return <ReactQuill theme="snow" {...props} />
}
