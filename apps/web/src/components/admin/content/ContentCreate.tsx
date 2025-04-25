import {
  DateInput,
  Create,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextInput,
  required,
  ReferenceArrayInput,
  ReferenceManyField,
  Datagrid,
  TextField,
  SelectArrayInput,
} from "react-admin";
import { useFormContext } from "react-hook-form";
import { InputAdornment, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { slugify } from "@flarekit/database";
import { MdxEditorInput } from "../components/MdxEditorInput";

const generateShortId = () => Math.random().toString(36).substring(2, 8);

const PublishedAtField = () => {
  const { watch } = useFormContext();
  const status = watch("status"); // Watch "status" field

  if (status !== "published") return null; // Show only if "published"

  /* Date Fields (Nullable) */
  return (
    <DateInput
      source="publishedAt"
      type="datetime-local"
      format={(value) =>
        value ? new Date(value).toISOString().slice(0, 16) : ""
      }
      parse={(value) => (value ? new Date(value).toISOString() : null)}
    />
  );
};

const ShortIdInput = () => {
  const { setValue } = useFormContext();

  return (
    <TextInput
      source="shortId"
      label="Short ID"
      defaultValue={generateShortId()}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Button
                onClick={() => {
                  setValue("shortId", generateShortId());
                }}
                size="small"
              >
                Generate
              </Button>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

const SlugInput = () => {
  const { watch, setValue } = useFormContext();
  const title = watch("title");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (title && !isDirty) {
      setValue("slug", slugify(title));
    }
  }, [title, setValue, isDirty]);

  return (
    <TextInput
      source="slug"
      validate={required()}
      onChange={(e) => setIsDirty(true)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Button
                onClick={() => {
                  setValue("slug", slugify(title));
                  setIsDirty(false);
                }}
                size="small"
                variant="outlined"
              >
                Re-create
              </Button>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export const ContentCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ shortId: generateShortId() }}>
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
      <SlugInput />

      {/* Nullable content */}
      <MdxEditorInput source="content" />

      <ReferenceArrayInput
        source="taxonomyIds"
        reference="taxonomies"
        filter={{ type: "tag" }} // Optional: filter to show only tags
      >
        <SelectArrayInput
          optionText="name"
          optionValue="id"
          translateChoice={false}
        />
      </ReferenceArrayInput>

      {/* Separate input for categories if needed */}
      <ReferenceArrayInput
        source="categoryIds"
        reference="taxonomies"
        filter={{ type: "category" }}
      >
        <SelectArrayInput
          optionText="name"
          optionValue="id"
          translateChoice={false}
        />
      </ReferenceArrayInput>

      <ShortIdInput />

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
  </Create>
);
