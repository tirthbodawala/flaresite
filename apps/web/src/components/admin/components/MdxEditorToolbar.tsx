import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  InsertCodeBlock,
  InsertFrontmatter,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
} from "@mdxeditor/editor";
import React from "react";

/**
 * A toolbar component that includes all toolbar components.
 * Notice that some of the buttons will work only if you have the corresponding plugin enabled, so you should use it only for testing purposes.
 * You'll probably want to create your own toolbar component that includes only the buttons that you need.
 * @group Toolbar Components
 */
export const MdxEditorToolbar: React.FC = () => {
  return (
    <ConditionalContents
      options={[
        {
          when: (editor: any) => editor?.editorType === "codeblock",
          contents: () => <ChangeCodeMirrorLanguage />,
        },
        {
          fallback: () => (
            <>
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <Separator />
              <StrikeThroughSupSubToggles />
              <Separator />
              <ListsToggle />
              <Separator />

              <ConditionalContents
                options={[{ fallback: () => <BlockTypeSelect /> }]}
              />

              <Separator />

              <CreateLink />
              <InsertImage />

              <Separator />

              <InsertTable />
              <InsertThematicBreak />

              <Separator />
              <InsertCodeBlock />

              <Separator />
              <InsertFrontmatter />
            </>
          ),
        },
      ]}
    />
  );
};
