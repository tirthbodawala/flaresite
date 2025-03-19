import {
  DateInput,
  Edit,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  required,
  useFieldValue,
} from "react-admin";
import { useFormContext } from "react-hook-form";
import { MdxEditorInput } from "../components/MdxEditorInput";

const PublishedAtField = () => {
  const { watch } = useFormContext();
  const status = watch("status"); // Watch "status" field

  if (status !== "published") return null; // Show only if "published"

  /* Date Fields (Nullable) */
  return <DateInput source="publishedAt" />;
};

export const ContentEdit = () => (
  <Edit>
    <SimpleForm>
      {/* Type field (Enum) */}
      <SelectInput
        source="type"
        choices={[
          { id: "post", name: "Post" },
          { id: "page", name: "Page" },
        ]}
        validate={required()}
      />

      <TextInput source="title" validate={required()} />
      <TextInput source="slug" validate={required()} />

      {/* Nullable content */}
      <MdxEditorInput source="content" />

      <TextInput source="shortId" label="Short ID" />

      {/* Author Reference with First Name, Last Name, and Username */}
      <ReferenceInput source="authorId" reference="authors" allowEmpty>
        <SelectInput
          optionText={(record) =>
            record
              ? `${record.firstName} ${record.lastName} (${record.username})`
              : "No Author"
          }
        />
      </ReferenceInput>

      {/* Status (Enum) */}
      <SelectInput
        source="status"
        choices={[
          { id: "draft", name: "Draft" },
          { id: "published", name: "Published" },
          { id: "private", name: "Private" },
        ]}
      />
      <PublishedAtField />
    </SimpleForm>
  </Edit>
);
