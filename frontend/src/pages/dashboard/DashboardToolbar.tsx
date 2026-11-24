import { formatNumber } from "../../locales/format";
import React from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Copy,
  Folder,
  FolderInput,
  Inbox,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { DrawingSortField, SortDirection } from "../../api";
import type { Collection } from "../../types";
import { PlayfulSelect } from "../../components/PlayfulSelect";
import { NewDrawingControl } from "./NewDrawingControl";
import { useLocale } from "../../context/useLocale";

type SortOption = {
  field: DrawingSortField;
  label: string;
  icon: React.ReactNode;
};

type DashboardToolbarProps = {
  search: string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  sortConfig: { field: DrawingSortField; direction: SortDirection };
  sortOptions: SortOption[];
  currentSortOption?: SortOption;
  showSortMenu?: boolean;
  sortedDrawingsCount: number;
  allSelected: boolean;
  hasSelection: boolean;
  isTrashView: boolean;
  isSharedView: boolean;
  isSharedCollection: boolean;
  currentCollection?: Collection;
  showBulkMoveMenu: boolean;
  selectedCount: number;
  collections: Collection[];
  onSearchChange: (value: string) => void;
  onShowSortMenuChange?: (value: boolean) => void;
  onSortFieldChange: (field: DrawingSortField) => void;
  onSortDirectionToggle: () => void;
  onSelectAll: () => void;
  onBulkDeleteClick: () => void;
  onBulkDuplicate: () => void;
  onShowBulkMoveMenuChange: (value: boolean) => void;
  onBulkMove: (collectionId: string | null) => void;
  onImportDrawings: (files: FileList | null) => void;
  onCreateDrawing: () => void;
  onViewerActionError: (message: string) => void;
};

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  search,
  searchInputRef,
  sortConfig,
  sortOptions,
  sortedDrawingsCount,
  allSelected,
  hasSelection,
  isTrashView,
  isSharedView,
  isSharedCollection,
  currentCollection,
  showBulkMoveMenu,
  selectedCount,
  collections,
  onSearchChange,
  onSortFieldChange,
  onSortDirectionToggle,
  onSelectAll,
  onBulkDeleteClick,
  onBulkDuplicate,
  onShowBulkMoveMenuChange,
  onBulkMove,
  onImportDrawings,
  onCreateDrawing,
  onViewerActionError,
}) => {
  const { t, plural, locale } = useLocale();
  const canModifySelection =
    !isSharedView &&
    (!isSharedCollection || currentCollection?.sharedRole === "edit");

  return (
    <div className="mb-6 flex flex-col items-stretch justify-between gap-3 lg:mb-8 2xl:flex-row 2xl:items-center">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap 2xl:flex-1">
        <div className="group relative w-full transition-transform duration-200 focus-within:-translate-y-0.5 sm:max-w-sm sm:flex-1 xl:max-w-md">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t("dashboard.toolbar.search")}
            aria-label={t("dashboard.toolbar.searchLabel")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-[42px] w-full rounded-xl border-2 border-slate-800 bg-white pl-10 pr-12 text-sm text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.9)] outline-none transition-shadow placeholder:text-slate-400 focus:shadow-[3px_3px_0px_0px_rgba(79,70,229,0.9)] focus-visible:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.18)] dark:placeholder:text-neutral-500 dark:focus:shadow-[3px_3px_0px_0px_rgba(129,140,248,0.6)]"
          />
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500 dark:text-neutral-500 dark:group-focus-within:text-indigo-300"
            size={17}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                searchInputRef.current?.focus();
              }}
              aria-label={t("dashboard.grid.clearSearch")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 font-sans text-[10px] font-semibold text-slate-400 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <PlayfulSelect
            ariaLabel={t("dashboard.toolbar.sort")}
            value={sortConfig.field}
            onChange={(value) => onSortFieldChange(value as DrawingSortField)}
            options={sortOptions.map((option) => ({
              value: option.field,
              label: option.label,
              icon: option.icon,
            }))}
            className="min-w-0 flex-1 sm:flex-none"
            buttonClassName="h-[42px] w-full sm:w-[184px] px-3"
            menuClassName="min-w-[184px]"
          />
          <button
            onClick={onSortDirectionToggle}
            className="ui-icon-button h-[42px] w-[42px] text-indigo-600 dark:text-indigo-400"
            title={
              sortConfig.direction === "asc"
                ? t("dashboard.toolbar.ascending")
                : t("dashboard.toolbar.descending")
            }
            aria-label={
              sortConfig.direction === "asc"
                ? t("dashboard.toolbar.ascending")
                : t("dashboard.toolbar.descending")
            }
          >
            {sortConfig.direction === "asc" ? (
              <ArrowUp size={18} />
            ) : (
              <ArrowDown size={18} />
            )}
          </button>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap 2xl:w-auto 2xl:justify-end">
        <div className="flex items-center gap-2 sm:mr-1">
          <div className="ui-button-group" role="group" aria-label={t("dashboard.toolbar.selection")}>
            <button
              onClick={onSelectAll}
              disabled={sortedDrawingsCount === 0}
              className={clsx(
                "ui-button-group-item",
                (allSelected || hasSelection) &&
                  "text-indigo-600 dark:text-indigo-400",
              )}
              title={allSelected ? t("dashboard.toolbar.deselectAll") : t("dashboard.toolbar.selectAll")}
              aria-label={allSelected ? t("dashboard.toolbar.deselectAll") : t("dashboard.toolbar.selectAll")}
            >
              {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <button
              onClick={onBulkDeleteClick}
              disabled={!hasSelection || !canModifySelection}
              className="ui-button-group-item hover:bg-rose-50 hover:text-rose-600 enabled:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:enabled:text-rose-400"
              title={isTrashView ? t("dashboard.actions.deletePermanently") : t("dashboard.actions.moveToTrash")}
              aria-label={
                isTrashView ? t("dashboard.actions.deletePermanently") : t("dashboard.actions.moveToTrash")
              }
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onBulkDuplicate}
              disabled={!hasSelection || isTrashView || !canModifySelection}
              className="ui-button-group-item"
              title={t("dashboard.toolbar.duplicateSelected")}
              aria-label={t("dashboard.toolbar.duplicateSelected")}
            >
              <Copy size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  hasSelection && onShowBulkMoveMenuChange(!showBulkMoveMenu)
                }
                disabled={!hasSelection || !canModifySelection}
                className={clsx(
                  "ui-button-group-item",
                  showBulkMoveMenu &&
                    "bg-indigo-50 text-indigo-600 dark:bg-neutral-700 dark:text-indigo-300",
                )}
                title={t("dashboard.toolbar.moveSelected")}
                aria-label={t("dashboard.toolbar.moveSelected")}
                aria-expanded={showBulkMoveMenu}
              >
                <FolderInput size={18} />
              </button>
              {showBulkMoveMenu && hasSelection && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => onShowBulkMoveMenuChange(false)}
                  />
                  <div className="ui-menu absolute left-0 top-full z-50 mt-2 max-h-64 w-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 sm:left-auto sm:right-0">
                    <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                      {plural("dashboard.toolbar.moveCount", selectedCount, { count: formatNumber(selectedCount, locale) })}
                    </div>
                    <button
                      onClick={() => onBulkMove(null)}
                      className="ui-menu-item"
                    >
                      <Inbox size={14} /> {t("sidebar.unorganized")}
                    </button>
                    {collections
                      .filter((collection) => collection.id !== "trash")
                      .map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => onBulkMove(collection.id)}
                          className="ui-menu-item"
                        >
                          <Folder size={14} />
                          <span className="truncate">{collection.name}</span>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {hasSelection && (
            <span className="whitespace-nowrap rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold tabular-nums text-indigo-700 animate-in fade-in zoom-in-95 duration-150 dark:bg-indigo-500/15 dark:text-indigo-300">
              {t("dashboard.toolbar.selected", { count: formatNumber(selectedCount, locale) })}
            </span>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <input
            type="file"
            accept=".excalidash,.excalidraw,.json"
            multiple
            className="hidden"
            id="dashboard-import"
            onChange={(event) => {
              onImportDrawings(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            onClick={() => {
              if (
                isSharedCollection &&
                currentCollection?.sharedRole !== "edit"
              ) {
                onViewerActionError(t("dashboard.actions.viewerImport"));
                return;
              }
              document.getElementById("dashboard-import")?.click();
            }}
            disabled={isTrashView || isSharedView}
            className={clsx(
              "ui-button-secondary h-[42px] flex-1 whitespace-nowrap px-4 sm:flex-none",
              !(isTrashView || isSharedView) &&
                "text-indigo-700 dark:text-indigo-300",
            )}
          >
            <Upload size={17} strokeWidth={2.5} />
            <span className="sm:hidden">{t("dashboard.toolbar.importShort")}</span>
            <span className="hidden sm:inline">{t("dashboard.toolbar.import")}</span>
          </button>
          <NewDrawingControl
            disabled={isTrashView || isSharedView}
            onCreate={onCreateDrawing}
            canCreate={() => {
              if (
                isSharedCollection &&
                currentCollection?.sharedRole !== "edit"
              ) {
                onViewerActionError(t("dashboard.actions.viewerCreate"));
                return false;
              }
              return true;
            }}
          />
        </div>
      </div>
    </div>
  );
};
