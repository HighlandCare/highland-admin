import { useMemo } from "react";
import PropTypes from "prop-types";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import { useRouter } from "next/router";
import {
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  getServerPaginationProps,
} from "../../components/data-table";
import { StatusBadge, TablePersonCell, TableQuickActions } from "../../components/table-cells";
import { formatDateTime } from "../../utils/dateUtils";
import {
  formatSupportLabel,
  getSubmitterImageUrl,
  getSupportQueryId,
  getSupportStatusMeta,
  storeSupportQueryDetail,
  SUPPORT_QUERY_CATEGORIES,
  SUPPORT_QUERY_ROLES,
  SUPPORT_QUERY_STATUSES,
} from "../../utils/supportQueryUtils";

const filterFieldSx = {
  minWidth: { xs: "100%", sm: 140 },
  "& .MuiInputBase-root": { bgcolor: "background.paper" },
};

export function SupportQueriesTable({
  category = "all",
  items = [],
  loading = false,
  onCategoryChange = () => {},
  onPageChange = () => {},
  onRoleChange = () => {},
  onSearchChange = () => {},
  onStatusChange = () => {},
  page = 1,
  role = "all",
  search = "",
  status = "all",
  total = 0,
  totalPages = 1,
}) {
  const router = useRouter();

  const rows = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const handleView = (item) => {
    storeSupportQueryDetail(item);
    const id = getSupportQueryId(item);
    if (id) {
      router.push(`/help-feedback/detail?id=${id}`);
    }
  };

  const filterActions = (
    <>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Status"
        onChange={(event) => onStatusChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={status}
      >
        {SUPPORT_QUERY_STATUSES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Role"
        onChange={(event) => onRoleChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={role}
      >
        {SUPPORT_QUERY_ROLES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Category"
        onChange={(event) => onCategoryChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={category}
      >
        {SUPPORT_QUERY_CATEGORIES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

  return (
    <DataTable
      empty={!loading && rows.length === 0}
      pagination={getServerPaginationProps({
        currentPage: page,
        onPageChange,
        totalPages,
        totalRecords: total,
      })}
      toolbar={
        <DataTableToolbar
          actions={filterActions}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by subject"
          searchValue={search}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Submitter</TableCell>
          <TableCell>Category</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Last message</TableCell>
          <TableCell>Updated</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <Typography color="text.secondary" variant="body2">
                Loading support queries…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((item) => {
            const statusMeta = getSupportStatusMeta(item.status);
            const submitter = item.submitter || {};
            return (
              <TableRow hover key={getSupportQueryId(item)}>
                <TableCell>
                  <TablePersonCell
                    imageUrl={getSubmitterImageUrl(submitter)}
                    name={submitter.fullName}
                    subtitle={
                      submitter.email ||
                      formatSupportLabel(item.submitterRole || submitter.userType)
                    }
                  />
                </TableCell>
                <TableCell>{formatSupportLabel(item.category)}</TableCell>
                <TableCell>
                  <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatSupportLabel(item.lastMessageByRole)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatDateTime(item.lastMessageAt || item.updatedAt || item.createdAt)}
                </TableCell>
                <TableCell align="right">
                  <TableQuickActions
                    actions={[
                      {
                        icon: EyeIcon,
                        label: "View support query",
                        onClick: () => handleView(item),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </DataTable>
  );
}

SupportQueriesTable.propTypes = {
  category: PropTypes.string,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onCategoryChange: PropTypes.func,
  onPageChange: PropTypes.func,
  onRoleChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  page: PropTypes.number,
  role: PropTypes.string,
  search: PropTypes.string,
  status: PropTypes.string,
  total: PropTypes.number,
  totalPages: PropTypes.number,
};
