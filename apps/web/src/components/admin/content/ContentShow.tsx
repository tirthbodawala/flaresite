import {
  DateField,
  FunctionField,
  ReferenceField,
  Show,
  SimpleShowLayout,
  TextField,
  useRecordContext,
} from "react-admin";
import { MdxViewer } from "../components/MdxViewer";
import { format } from "date-fns";
import { Box, Typography, Chip, Avatar, Stack, styled } from "@mui/material";

const StyledLink = styled("a")(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
}));

const Link = (record: any) => {
  if (record) {
    const url = new URL(
      `/${record.slug}-${record.shortId}/`,
      window.location.origin,
    ).toString();
    return (
      <StyledLink
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >{`/${record.slug}-${record.shortId}/`}</StyledLink>
    );
  }
  return null;
};

const ContentMetadata = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Stack spacing={2}>
      <TextField
        source="title"
        sortable
        component="h1"
        style={{
          fontSize: "1.4rem",
        }}
      />

      {/* Type and Status Badges */}
      <Stack direction="row" spacing={1}>
        <Chip
          label={record.type}
          color="primary"
          variant="outlined"
          size="small"
          style={{ textTransform: "capitalize" }}
        />
        <Chip
          label={record.status}
          color={record.status === "published" ? "success" : "error"}
          variant="outlined"
          size="small"
          style={{ textTransform: "capitalize" }}
        />
      </Stack>

      {/* Link */}
      <Box>
        <FunctionField render={Link} />
      </Box>
    </Stack>
  );
};

const AuthorAvatar = () => {
  const record = useRecordContext();
  if (!record?.firstName) return <Avatar>A</Avatar>;
  return <Avatar>{record.firstName[0].toUpperCase()}</Avatar>;
};

const ContentFooter = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Box pt={2} borderTop={1} borderColor="divider">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <ReferenceField source="authorId" reference="authors">
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 40, height: 40 }}>
                <AuthorAvatar />
              </Avatar>
              <Stack>
                <TextField source="firstName" variant="body1" />
                <TextField source="lastName" variant="body1" />
              </Stack>
            </Box>
          </ReferenceField>
        </Box>
        <Stack spacing={0.5} textAlign="right">
          {record.publishedAt && (
            <Typography variant="body2" color="text.secondary">
              Published: {format(new Date(record.publishedAt), "MMMM dd, yyyy")}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Last updated: {format(new Date(record.updatedAt), "MMMM dd, yyyy")}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export const ContentShow = () => (
  <Show>
    <SimpleShowLayout>
      <ContentMetadata />
      <Box>
        <FunctionField
          render={(record) =>
            record ? <MdxViewer source={record.content} /> : null
          }
        />
      </Box>
      <ContentFooter />
    </SimpleShowLayout>
  </Show>
);
