import {
  Datagrid,
  DateField,
  List,
  ReferenceField,
  TextField,
  FunctionField,
} from "react-admin";
import { Chip } from "@mui/material";
export const ContentList = () => (
  <List>
    <Datagrid>
      <FunctionField
        source="type"
        render={(record) => (
          <Chip
            label={record.type}
            color="primary"
            variant="outlined"
            size="small"
            style={{ textTransform: "capitalize" }}
          />
        )}
      />
      <FunctionField
        label="Title"
        sortable
        sortBy="title"
        source="title"
        render={(record: {
          title: string;
          slug: string;
          shortId: string;
          status: string;
        }) => {
          if (!record) return null;

          const withSlug = `/${record.slug}-${record.shortId}/`;
          const url = new URL(withSlug, window.location.origin).toString();

          return (
            <div>
              <div>{record.title}</div>
              {record.status === "published" && (
                <div style={{ fontSize: "0.8em", marginTop: "4px" }}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2196f3", textDecoration: "none" }}
                  >
                    {withSlug}
                  </a>
                </div>
              )}
            </div>
          );
        }}
      />
      <FunctionField
        source="status"
        render={(record) => (
          <Chip
            label={record.status}
            color={record.status === "published" ? "success" : "error"}
            variant="outlined"
            size="small"
            style={{ textTransform: "capitalize" }}
          />
        )}
      />
      <ReferenceField source="authorId" reference="authors">
        <TextField source="firstName" /> <TextField source="lastName" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <DateField source="publishedAt" />
    </Datagrid>
  </List>
);
