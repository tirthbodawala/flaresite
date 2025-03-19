import { useInput, type InputProps } from "react-admin";
import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
} from "@mui/material";
import { MdxEditorToolbar } from "./MdxEditorToolbar";

export const MdxEditorInput = ({ source, label }: InputProps) => {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useInput({ source });

  return (
    <FormControl fullWidth margin="dense" error={!!error}>
      {/* Label */}
      <FormLabel>{label}</FormLabel>

      {/* MDX Editor */}
      <MDXEditor
        markdown={value || ""}
        onChange={onChange}
        plugins={[
          toolbarPlugin({ toolbarContents: () => <MdxEditorToolbar /> }),
          listsPlugin(),
          quotePlugin(),
          headingsPlugin({ allowedHeadingLevels: [2, 3, 4, 5, 6] }),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              css: "CSS",
              txt: "text",
              tsx: "TypeScript",
            },
          }),
          markdownShortcutPlugin(),
        ]}
      />

      {/* Helper Text / Error Message */}
      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
};
