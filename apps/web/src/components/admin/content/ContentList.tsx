import {
  Datagrid,
  DateField,
  List,
  ReferenceField,
  TextField,
  FunctionField,
} from "react-admin";

export const ContentList = () => (
  <List>
    <Datagrid>
      <TextField source="type" />
      <TextField source="title" />
      <FunctionField
        label="Link"
        render={(record) => {
          if (record) {
            const url = new URL(
              `/${record.slug}-${record.shortId}`,
              window.location.origin,
            ).toString();
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700"
              >
                Link
              </a>
            );
          }
          return null;
        }}
      />
      <TextField source="status" />
      <ReferenceField source="authorId" reference="authors">
        <TextField source="firstName" /> <TextField source="lastName" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);
