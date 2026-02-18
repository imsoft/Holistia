"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Heading } from '@tiptap/extension-heading';
import CharacterCount from '@tiptap/extension-character-count';
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
  Heading3,
  ClipboardPaste
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Limpia HTML pegado (medios, estilos, data-*) y devuelve HTML seguro o párrafo con texto plano. */
function cleanPastedHtml(html: string): string {
  if (!html || !html.trim()) return html;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  tempDiv.querySelectorAll('img, svg, video, iframe, canvas, object, embed').forEach((el) => el.remove());
  tempDiv.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name === 'style' || attr.name.startsWith('data-')) el.removeAttribute(attr.name);
    });
  });
  let result = tempDiv.innerHTML.trim();
  if (!result && tempDiv.textContent?.trim()) {
    const text = tempDiv.textContent.trim();
    result = text ? `<p>${escapeHtml(text)}</p>` : result;
  }
  return result || html;
}

/** Convierte texto plano con saltos de línea (ej. WhatsApp) a HTML con <p> y <br>. */
function plainTextToHtml(text: string): string {
  const t = text.trim();
  if (!t) return '';
  const paragraphs = t.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const line = p.trim().split('\n').map((l) => escapeHtml(l)).join('<br>');
      return line ? `<p>${line}</p>` : '';
    })
    .filter(Boolean)
    .join('');
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onValidationChange?: (isValid: boolean) => void;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escribe aquí el contenido de tu post...",
  className,
  maxLength = 500,
  onValidationChange
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [, forceUpdate] = useState({});
  const isUpdatingFromOutside = useRef(false);
  const lastContentRef = useRef<string>(content || '');
  const isFocusedRef = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    enablePasteRules: true,
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromOutside.current) {
        const newContent = editor.getHTML();
        const charCount = editor.storage.characterCount.characters();
        const isValid = charCount <= maxLength;
        
        if (onValidationChange) {
          onValidationChange(isValid);
        }
        
        lastContentRef.current = newContent;
        if (!isFocusedRef.current) {
          onChange(newContent);
        }
      }
      forceUpdate({});
      
      // Actualizar estilos de texto excedente después de un pequeño delay
      setTimeout(() => {
        if (editor && editorRef.current) {
          updateExceededTextStyles();
        }
      }, 50);
    },
    onFocus: () => {
      isFocusedRef.current = true;
    },
    onBlur: () => {
      isFocusedRef.current = false;
      if (editor && !isUpdatingFromOutside.current) {
        const currentContent = editor.getHTML();
        lastContentRef.current = currentContent;
        onChange(currentContent);
      }
    },
    onSelectionUpdate: () => {
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
        if (event.key === 'Enter' && event.shiftKey) {
          const { state, dispatch } = view;
          const { tr } = state;
          tr.replaceSelectionWith(state.schema.nodes.hardBreak.create());
          dispatch(tr);
          return true;
        }
        return false;
      },
      // No definir handlePaste: en muchos navegadores llamar a clipboardData.getData() en un
      // handler consume el portapapeles y el pegado por defecto deja de funcionar. Dejamos que
      // ProseMirror/Tiptap gestione todo el pegado; transformPastedHTML limpia HTML e imágenes.
      transformPastedHTML: (html) => cleanPastedHtml(html),
      handlePaste: (view, event) => {
        const ed = editorInstanceRef.current;
        if (!ed) return false;
        let toInsert = '';
        const data = event.clipboardData;
        if (data) {
          const html = data.getData('text/html');
          const text = data.getData('text/plain');
          if (html && html.trim()) toInsert = cleanPastedHtml(html);
          else if (text != null && String(text).trim()) toInsert = plainTextToHtml(String(text));
        }
        if (toInsert) {
          ed.commands.insertContent(toInsert);
          event.preventDefault();
          return true;
        }
        // Fallback: portapapeles universal (iPhone → Mac) a veces no llena clipboardData; reintentar tras 80 ms si viene vacío
        event.preventDefault();
        if (typeof navigator?.clipboard?.readText === 'function') {
          const tryInsert = (retry = false) => {
            navigator.clipboard.readText().then((t) => {
              const text = t?.trim();
              if (text && editorInstanceRef.current) editorInstanceRef.current.commands.insertContent(plainTextToHtml(text));
              else if (!retry) setTimeout(() => tryInsert(true), 80);
            }).catch(() => {});
          };
          tryInsert(false);
        }
        return true;
      },
      handleDrop: (view, event) => {
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
    editorInstanceRef.current = editor;
  }, [editor]);

  // Función para actualizar estilos de texto excedente usando CSS
  const updateExceededTextStyles = () => {
    if (!editor || !editorRef.current) return;

    const charCount = editor.storage.characterCount.characters();
    const editorElement = editorRef.current.querySelector('.ProseMirror') as HTMLElement;
    
    if (!editorElement) return;

    // Remover estilos anteriores
    editorElement.classList.remove('has-exceeded-text');
    const existingStyle = document.getElementById('exceeded-text-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (charCount <= maxLength) {
      return;
    }

    // Agregar clase al editor para indicar que tiene texto excedente
    editorElement.classList.add('has-exceeded-text');

    // Crear estilos CSS dinámicos para marcar texto excedente
    const styleElement = document.createElement('style');
    styleElement.id = 'exceeded-text-styles';
    
    // Calcular posiciones usando el documento de ProseMirror
    const doc = editor.view.state.doc;
    let charIndex = 0;
    const exceededRanges: Array<{ start: number; end: number }> = [];
    
    doc.descendants((node, pos) => {
      if (node.isText) {
        const nodeText = node.textContent;
        const nodeStart = charIndex;
        const nodeEnd = charIndex + nodeText.length;
        
        if (nodeEnd > maxLength) {
          const exceededStart = Math.max(0, maxLength - nodeStart);
          if (exceededStart < nodeText.length) {
            exceededRanges.push({
              start: pos + exceededStart,
              end: pos + nodeText.length
            });
          }
        }
        
        charIndex = nodeEnd;
      }
      return true;
    });

    // Generar CSS para marcar el texto excedente
    if (exceededRanges.length > 0) {
      // Usar un enfoque más simple: aplicar estilos a través de clases CSS
      // y usar JavaScript para aplicar los estilos directamente a los nodos
      styleElement.textContent = `
        .has-exceeded-text [data-exceeded="true"] {
          text-decoration: underline !important;
          text-decoration-color: red !important;
          text-decoration-thickness: 2px !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Aplicar el atributo data-exceeded a los nodos que exceden
      exceededRanges.forEach(range => {
        try {
          const startPos = editor.view.domAtPos(range.start);
          const endPos = editor.view.domAtPos(range.end);
          
          if (startPos.node && endPos.node) {
            // Crear un rango y envolver el contenido
            const domRange = document.createRange();
            domRange.setStart(startPos.node, startPos.offset);
            domRange.setEnd(endPos.node, endPos.offset);
            
            // Verificar si el rango es válido
            if (domRange.collapsed) return;
            
            const span = document.createElement('span');
            span.setAttribute('data-exceeded', 'true');
            span.style.textDecoration = 'underline';
            span.style.textDecorationColor = 'red';
            span.style.textDecorationThickness = '2px';
            
            try {
              domRange.surroundContents(span);
            } catch (e) {
              // Si falla, usar un enfoque alternativo
              const contents = domRange.extractContents();
              span.appendChild(contents);
              domRange.insertNode(span);
            }
          }
        } catch (e) {
          // Si falla, continuar con el siguiente rango
        }
      });
    }
  };

  // Aplicar estilos CSS dinámicos para marcar texto excedente
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    // Actualizar estilos inicialmente
    updateExceededTextStyles();

    // Actualizar estilos periódicamente (cada 300ms) para capturar cambios
    const intervalId = setInterval(() => {
      updateExceededTextStyles();
    }, 300);

    return () => {
      clearInterval(intervalId);
    };
  }, [editor, maxLength]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && isMounted) {
      if (isFocusedRef.current) {
        return;
      }

      const currentContent = editor.getHTML();
      const newContent = content || '<p></p>';
      
      if (currentContent === newContent) {
        return;
      }

      const normalizeHTML = (html: string) => {
        if (!html) return '';
        return html
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();
      };
      
      const normalizedCurrent = normalizeHTML(currentContent);
      const normalizedNew = normalizeHTML(newContent);
      
      if (normalizedCurrent !== normalizedNew) {
        isUpdatingFromOutside.current = true;
        lastContentRef.current = newContent;
        editor.commands.setContent(newContent, { emitUpdate: false });
        
        setTimeout(() => {
          isUpdatingFromOutside.current = false;
        }, 50);
      }
    }
  }, [content, editor, isMounted]);

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

  const charCount = editor.storage.characterCount.characters();
  const isValid = charCount <= maxLength;

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

  const handleContainerPaste = (e: React.ClipboardEvent) => {
    if (e.defaultPrevented) return;
    const ed = editorInstanceRef.current;
    if (!ed) return;
    let toInsert = '';
    const data = e.clipboardData;
    if (data) {
      const html = data.getData('text/html');
      const text = data.getData('text/plain');
      if (html && html.trim()) toInsert = cleanPastedHtml(html);
      else if (text != null && String(text).trim()) toInsert = plainTextToHtml(String(text));
    }
    if (toInsert) {
      e.preventDefault();
      e.stopPropagation();
      ed.commands.insertContent(toInsert);
      return;
    }
    // Fallback: portapapeles universal (p. ej. iPhone → Mac) a veces no llena clipboardData; reintentar tras 80 ms si viene vacío
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator?.clipboard?.readText === 'function') {
      const tryInsert = (retry = false) => {
        navigator.clipboard.readText().then((t) => {
          const text = t?.trim();
          if (text && editorInstanceRef.current) editorInstanceRef.current.commands.insertContent(plainTextToHtml(text));
          else if (!retry) setTimeout(() => tryInsert(true), 80);
        }).catch(() => {});
      };
      tryInsert(false);
    }
  };

  const handlePasteButton = () => {
    editor.chain().focus().run();
    if (typeof navigator?.clipboard?.readText !== 'function') {
      toast.error('Tu navegador no permite pegar desde el portapapeles');
      return;
    }
    navigator.clipboard.readText().then((text) => {
      const t = text?.trim();
      if (t) editor.commands.insertContent(plainTextToHtml(t));
      else toast.info('No hay nada que pegar en el portapapeles');
    }).catch(() => toast.error('No se pudo acceder al portapapeles'));
  };

  return (
    <div ref={editorRef} className="border rounded-lg overflow-hidden" onPaste={handleContainerPaste}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        <ToolbarButton
          onClick={(e) => { e.preventDefault(); handlePasteButton(); }}
          title="Pegar desde el portapapeles"
        >
          <ClipboardPaste className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border mx-1" />
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

      {/* Character Counter */}
      <div className="flex items-center justify-end p-2 border-t bg-muted/30">
        <div className={cn(
          "text-xs font-medium",
          charCount > maxLength
            ? "text-destructive font-bold"
            : charCount > maxLength * 0.9
            ? "text-orange-500"
            : "text-muted-foreground"
        )}>
          {charCount} / {maxLength} caracteres
          {charCount > maxLength && (
            <span className="ml-2 text-destructive">
              (Excede por {charCount - maxLength} caracteres)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
