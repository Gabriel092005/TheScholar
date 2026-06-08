import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Bold, Italic, Underline as UnderlineIcon, Highlighter } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({ editor, action, activeCheck, children }: {
  editor: Editor;
  action: () => void;
  activeCheck: () => boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
        activeCheck() ? "bg-gray-200 dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none outline-none min-h-[120px] px-3 py-2 text-sm text-gray-900 dark:text-white",
        placeholder: placeholder || "",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={`border border-input rounded-md bg-background overflow-hidden ${className}`}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-input bg-gray-50 dark:bg-zinc-800/50">
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleBold().run()} activeCheck={() => editor.isActive("bold")}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleItalic().run()} activeCheck={() => editor.isActive("italic")}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleUnderline().run()} activeCheck={() => editor.isActive("underline")}>
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-300 dark:bg-zinc-600 mx-1" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleHighlight().run()} activeCheck={() => editor.isActive("highlight")}>
          <Highlighter size={15} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
