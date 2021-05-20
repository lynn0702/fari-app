import { css } from "@emotion/css";
import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Fade from "@material-ui/core/Fade";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import { useTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import FolderIcon from "@material-ui/icons/Folder";
import ExportIcon from "@material-ui/icons/GetApp";
import SearchIcon from "@material-ui/icons/Search";
import React, { useState } from "react";
import { Images } from "../../constants/Images";
import { arraySort } from "../../domains/array/arraySort";
import { useLazyState } from "../../hooks/useLazyState/useLazyState";
import { listItem } from "../Manager/domains/ListItem";

// https://dribbble.com/shots/15388627-Global-Search

export type IManagerViewModel = {
  id: string;
  name: string;
  lastUpdated: number;
  group: string | undefined;
  type: string;
};

export type IManagerFolders = Record<string, Array<IManagerViewModel>>;

enum Where {
  Folders,
  Folder,
  Search,
}
export function MyStuff<TFolders extends string>(props: {
  folders: IManagerFolders;
  search: string;
  canGoBack: boolean;
  folder: string | undefined;
  onSelect(folder: TFolders, element: IManagerViewModel): void;
  onAdd(folder: TFolders): void;
  onDelete(folder: TFolders, element: IManagerViewModel): void;
  onDuplicate(folder: TFolders, element: IManagerViewModel): void;
  onUndo(folder: TFolders, element: IManagerViewModel): void;
  onImport(folder: TFolders, importPaths: FileList | null): void;
  onExport(folder: TFolders, element: IManagerViewModel): void;
}) {
  const theme = useTheme();
  const [search, setSearch] = useLazyState({
    value: props.search,
    delay: 750,
  });
  const [folder, setFolder] = useLazyState({
    value: props.folder,
    delay: 750,
  });
  const where = getWhere();

  function handleSetSearch(newSearch: string) {
    setSearch(newSearch);
    setFolder(undefined);
  }

  function handleGoBack() {
    setFolder(undefined);
    setSearch("");
  }

  return (
    <>
      <Box p="1rem">
        <Paper component="form">
          <Box px="1rem" mb="1rem">
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <Box mr=".5rem" width="30px">
                  {where === Where.Folders || !props.canGoBack ? (
                    <img
                      src={Images.app}
                      className={css({
                        display: "flex",
                        width: "1.5rem",
                        height: "auto",
                      })}
                    />
                  ) : (
                    <IconButton size="small" onClick={handleGoBack}>
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
              <Grid item xs>
                <InputBase
                  placeholder={folder ? folder : "Search..."}
                  value={search}
                  onChange={(e) => {
                    handleSetSearch(e.target.value);
                  }}
                />
              </Grid>
              <Grid item>
                <SearchIcon className={css({ display: "flex" })} />
              </Grid>
            </Grid>
          </Box>
        </Paper>
        {where === Where.Folders && renderFolders()}
        {where === Where.Folder && renderFolder()}
        {where === Where.Search && renderSearch()}
      </Box>
    </>
  );

  function renderFolders() {
    const folderNames = Object.keys(props.folders);
    return (
      <Box>
        <List dense>
          {folderNames.map((name, key) => {
            return (
              <ListItem
                key={key}
                button
                onClick={() => {
                  setFolder(name);
                }}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={name} />
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  }

  function renderFolder() {
    const currentFolder = folder as TFolders;
    const folderElements = props.folders[currentFolder];

    return (
      <Box>
        <Box>
          <Box mb="1rem">
            <Grid container justify="center" spacing={1}>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    props.onAdd(currentFolder);
                  }}
                >
                  {"New"}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  component="label"
                >
                  {"Import"}
                  <input
                    type="file"
                    accept=".json"
                    className={css({
                      display: "none",
                    })}
                    onChange={(event) => {
                      props.onImport(currentFolder, event.target.files);
                      event.target.value = "";
                    }}
                  />
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box>{renderLatestElements()}</Box>
          <Box>{renderElements(folderElements)}</Box>
        </Box>
      </Box>
    );
  }

  function renderSearch() {
    const allElements = Object.keys(props.folders).flatMap((folderName) => {
      return props.folders[folderName];
    });
    const searchElements = allElements.filter((e) => {
      const nameLower = e.name.toLowerCase();
      const groupLower = e.group?.toLowerCase() ?? "";
      const searchLower = search.toLowerCase();
      if (nameLower.includes(searchLower) || groupLower.includes(searchLower)) {
        return true;
      }
      return false;
    });
    return (
      <Box>
        <Box>{renderElements(searchElements, true)}</Box>
      </Box>
    );
  }

  function renderLatestElements() {
    const currentFolder = folder as TFolders;
    const elements = props.folders[currentFolder];
    const elementsSortedByLatest = arraySort(elements, [
      (e) => ({ value: e.lastUpdated, direction: "desc" }),
    ]);
    const elementsForLatest = elementsSortedByLatest.slice(0, 3);
    return (
      <Box>
        {elementsForLatest.length > 0 &&
          renderHeader("Latest", elementsForLatest.length)}
        <List dense>
          {elementsForLatest.map((element, key) => {
            return (
              <React.Fragment key={key}>
                <Element
                  element={element}
                  displayType={false}
                  onSelect={() => {
                    props.onSelect(currentFolder, element);
                  }}
                  onDelete={() => {
                    props.onDelete(currentFolder, element);
                  }}
                  onDuplicate={() => {
                    props.onDuplicate(currentFolder, element);
                  }}
                  onExport={() => {
                    props.onExport(currentFolder, element);
                  }}
                />
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    );
  }

  function renderElements(elements: IManagerViewModel[], displayType = false) {
    const currentFolder = folder as TFolders;
    const groups = elements.reduce((acc, curr) => {
      const group = curr.group || "";
      const currentList = acc[group] ?? [];
      return {
        ...acc,
        [group]: [...currentList, curr],
      };
    }, {} as Record<string, Array<IManagerViewModel>>);

    const groupNames = Object.keys(groups);

    return (
      <Box>
        {groupNames.length === 0 && (
          <Grid container justify="center">
            <Grid item>
              <Typography variant="subtitle2" color="textSecondary">
                {"Nothing here yet"}
              </Typography>
            </Grid>
          </Grid>
        )}
        {groupNames.map((groupName, key) => {
          const groupItems = groups[groupName];
          const sortedGroupItems = arraySort(groupItems, [
            (e) => ({ value: e.lastUpdated, direction: "desc" }),
          ]);
          return (
            <Box key={key}>
              <Box>{renderHeader(groupName, groupItems.length)}</Box>
              <List dense>
                {sortedGroupItems.map((element) => {
                  return (
                    <React.Fragment key={key}>
                      <Element
                        element={element}
                        displayType={displayType}
                        onSelect={() => {
                          props.onSelect(currentFolder, element);
                        }}
                        onDelete={() => {
                          props.onDelete(currentFolder, element);
                        }}
                        onDuplicate={() => {
                          props.onDuplicate(currentFolder, element);
                        }}
                        onExport={() => {
                          props.onExport(currentFolder, element);
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>
    );
  }

  function renderHeader(title: string, length: number) {
    return (
      <Box
        px="1rem"
        py=".5rem"
        className={css({
          background: theme.palette.action.hover,
          borderRadius: "4px",
        })}
      >
        <Box>
          <span
            className={css({
              fontWeight: theme.typography.fontWeightBold,

              color: theme.palette.text.primary,
            })}
          >
            {title}{" "}
          </span>
          <span
            className={css({
              color: theme.palette.text.hint,
            })}
          >
            {`(${length})`}
          </span>
        </Box>
      </Box>
    );
  }
  function getWhere() {
    if (search !== "") {
      return Where.Search;
    }
    if (!!folder) {
      return Where.Folder;
    }
    return Where.Folders;
  }
}

function Element(props: {
  element: IManagerViewModel;
  displayType: boolean;
  onSelect(): void;
  onExport(): void;
  onDuplicate(): void;
  onDelete(): void;
}) {
  const theme = useTheme();
  const abrev = listItem.getAbreviation(props.element.name);
  const backgroundColor = listItem.getColor(props.element.name);
  const color = theme.palette.getContrastText(backgroundColor);
  const [hover, setHover] = useState(false);
  return (
    <ListItem
      button
      onPointerEnter={() => {
        setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
      }}
      onClick={() => {
        props.onSelect();
      }}
    >
      <ListItemAvatar>
        <Avatar
          className={css({
            color: color,
            backgroundColor: backgroundColor,
          })}
        >
          {abrev}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={props.element.name}
        secondary={props.element.type}
      />
      <Fade in={hover} timeout={theme.transitions.duration.shortest}>
        <ListItemSecondaryAction>
          <Grid container spacing={1}>
            <Grid item>
              <IconButton
                size="small"
                data-cy="manager.export"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onExport();
                }}
              >
                <ExportIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton
                size="small"
                data-cy="manager.duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDuplicate();
                }}
              >
                <FileCopyIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton
                size="small"
                data-cy="manager.delete"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDelete();
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </ListItemSecondaryAction>
      </Fade>
    </ListItem>
  );
}
