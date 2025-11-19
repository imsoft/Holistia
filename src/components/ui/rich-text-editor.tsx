"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Heading } from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Escribe aquí el contenido de tu post...",
  className 
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [, forceUpdate] = useState({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom one
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      // Forzar actualización para reflejar cambios en el estado activo de los botones
      forceUpdate({});
    },
    onSelectionUpdate: () => {
      // Actualizar estado cuando cambia la selección
      forceUpdate({});
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 border rounded-md",
          "prose-p:leading-relaxed prose-p:my-4",
          "prose-headings:leading-tight prose-headings:my-6",
          "prose-ul:leading-relaxed prose-ol:leading-relaxed",
          "prose-li:leading-relaxed",
          "[&>p]:leading-relaxed [&>p]:mb-4",
          "[&>h1]:leading-tight [&>h1]:mt-6 [&>h1]:mb-4",
          "[&>h2]:leading-tight [&>h2]:mt-6 [&>h2]:mb-4",
          "[&>h3]:leading-tight [&>h3]:mt-5 [&>h3]:mb-3",
          "[&>ul]:leading-relaxed [&>ol]:leading-relaxed",
          "[&>li]:leading-relaxed",
          className
        ),
        style: "line-height: 1.75;",
      },
      handleKeyDown: (view, event) => {
        // Permitir que Shift+Enter cree un <br> en lugar de un nuevo párrafo
        if (event.key === 'Enter' && event.shiftKey) {
          const { state, dispatch } = view;
          const { tr } = state;
          tr.replaceSelectionWith(state.schema.nodes.hardBreak.create());
          dispatch(tr);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Prevenir pegar imágenes
        const clipboardData = event.clipboardData;
        if (clipboardData) {
          const items = Array.from(clipboardData.items);
          const hasImage = items.some(item => item.type.startsWith('image/'));
          if (hasImage) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        // Prevenir arrastrar y soltar imágenes
        const dataTransfer = event.dataTransfer;
        if (dataTransfer) {
          const hasImage = Array.from(dataTransfer.files).some(
            file => file.type.startsWith('image/')
          );
          if (hasImage) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Actualizar el contenido del editor cuando cambia la prop content (solo si es diferente)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const currentContent = editor.getHTML();
      // Solo actualizar si el contenido realmente cambió (evitar loops)
      if (content !== currentContent && content !== '<p></p>') {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor || !isMounted) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="min-h-[400px] p-4 bg-muted/20 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    isDisabled = false,
    children, 
    title 
  }: { 
    onClick: (e: React.MouseEvent) => void; 
    isActive?: boolean;
    isDisabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      disabled={isDisabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          isActive={editor.isActive('bold')}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          isActive={editor.isActive('italic')}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          isActive={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run();
          }}
          isActive={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            if (editor.can().undo()) {
              editor.chain().focus().undo().run();
            }
          }}
          isDisabled={!editor.can().undo()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={(e) => {
            e.preventDefault();
            if (editor.can().redo()) {
              editor.chain().focus().redo().run();
            }
          }}
          isDisabled={!editor.can().redo()}
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
