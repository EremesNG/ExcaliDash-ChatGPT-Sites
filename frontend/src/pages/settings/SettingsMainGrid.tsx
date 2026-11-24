import {
  Archive,
  CopyPlus,
  PanelLeft,
  Eye,
  EyeOff,
  Languages,
  Monitor,
  Moon,
  Sun,
  Zap,
  ZapOff,
} from "lucide-react";
import type * as api from "../../api";
import { PlayfulSelect } from "../../components/PlayfulSelect";
import { PlayfulSwitch } from "../../components/PlayfulSwitch";
import { UpdateSettingsCard } from "./UpdateSettingsCard";
import {
  SettingsCard,
  SettingsRow,
  settingsPrimaryButtonClass,
} from "./SettingsRow";
import { useLocale } from "../../context/useLocale";
import { APP_LANGUAGES } from "../../i18n";
import { formatNumber } from "../../locales/format";
import {
  MIN_IMAGE_COMPRESSION_THRESHOLD_MB,
  MAX_IMAGE_COMPRESSION_THRESHOLD_MB,
  normalizeImageCompressionThreshold,
} from "../../utils/imageCompressionSettings";

type SettingsMainGridProps = {
  exportBackup: () => void;
  theme: "light" | "dark";
  themePreference: api.ThemePreference;
  onThemePreferenceChange: (preference: api.ThemePreference) => void;
  imageCompression: boolean;
  toggleImageCompression: () => void;
  imageCompressionThresholdMb: number;
  onImageCompressionThresholdChange: (value: number) => void;
  editorAutoHide: boolean;
  onEditorAutoHideChange: (enabled: boolean) => void;
  compactSidebar: boolean;
  onCompactSidebarChange: (enabled: boolean) => void;
  appendDroppedDrawings: boolean;
  onAppendDroppedDrawingsChange: (enabled: boolean) => void;
  updateChannel: api.UpdateChannel;
  updateInfo: api.UpdateInfo | null;
  updateLoading: boolean;
  updateError: string | null;
  onUpdateChannelChange: (channel: api.UpdateChannel) => void;
  onCheckForUpdates: () => void;
};

export const SettingsMainGrid = ({
  exportBackup,
  theme,
  themePreference,
  onThemePreferenceChange,
  imageCompression,
  toggleImageCompression,
  imageCompressionThresholdMb,
  onImageCompressionThresholdChange,
  editorAutoHide,
  onEditorAutoHideChange,
  compactSidebar,
  onCompactSidebarChange,
  appendDroppedDrawings,
  onAppendDroppedDrawingsChange,
  updateChannel,
  updateInfo,
  updateLoading,
  updateError,
  onUpdateChannelChange,
  onCheckForUpdates,
}: SettingsMainGridProps) => {
  const { language, setLanguage, t, locale } = useLocale();

  return (
    <SettingsCard>
      <SettingsRow
        icon={<Languages size={20} />}
        tileClassName="border-black bg-emerald-400 text-black dark:border-neutral-700 dark:bg-emerald-400 dark:text-black"
        title={t("settings.language")}
      >
        <select
          aria-label={t("settings.language")}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="ui-input text-sm font-bold"
        >
          {APP_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>{label}</option>
          ))}
          {!APP_LANGUAGES.some(({ code }) => code === language) && (
            <option value={language}>{t("settings.language.editor", { language })}</option>
          )}
        </select>
      </SettingsRow>

      <SettingsRow
        icon={theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
        tileClassName="border-black bg-amber-400 text-black dark:border-neutral-700 dark:bg-amber-400 dark:text-black"
        title={t("settings.appearance.title")}
        description={
          themePreference === "system"
            ? t("settings.appearance.followingSystem", { theme: t(theme === "light" ? "settings.appearance.light" : "settings.appearance.dark").toLocaleLowerCase(locale) })
            : undefined
        }
      >
        <PlayfulSelect
          ariaLabel={t("settings.appearance.theme")}
          value={themePreference}
          onChange={(value) =>
            onThemePreferenceChange(
              value === "light" || value === "dark" ? value : "system",
            )
          }
          options={[
            { value: "light", label: t("settings.appearance.light"), icon: <Sun size={14} /> },
            { value: "dark", label: t("settings.appearance.dark"), icon: <Moon size={14} /> },
            { value: "system", label: t("settings.appearance.system"), icon: <Monitor size={14} /> },
          ]}
        />
      </SettingsRow>

      <SettingsRow
        icon={editorAutoHide ? <EyeOff size={20} /> : <Eye size={20} />}
        tileClassName="border-black bg-cyan-400 text-black dark:border-neutral-700 dark:bg-cyan-400 dark:text-black"
        title={t("settings.header.title")}
        description={
          editorAutoHide ? t("settings.header.hidden") : t("settings.header.visible")
        }
      >
        <PlayfulSwitch
          checked={editorAutoHide}
          onChange={onEditorAutoHideChange}
          ariaLabel={t("settings.header.toggle")}
        />
      </SettingsRow>

      <SettingsRow
        icon={<PanelLeft size={20} />}
        tileClassName="border-black bg-violet-400 text-black dark:border-neutral-700 dark:bg-violet-400 dark:text-black"
        title={t("settings.sidebar.title")}
        description={t("settings.sidebar.description")}
      >
        <PlayfulSwitch
          checked={compactSidebar}
          onChange={onCompactSidebarChange}
          ariaLabel={t("settings.sidebar.toggle")}
        />
      </SettingsRow>

      <SettingsRow
        icon={<CopyPlus size={20} />}
        tileClassName="border-black bg-rose-400 text-black dark:border-neutral-700 dark:bg-rose-400 dark:text-black"
        title={t("settings.drop.append")}
        description={t("settings.drop.description")}
      >
        <PlayfulSwitch
          checked={appendDroppedDrawings}
          onChange={onAppendDroppedDrawingsChange}
          ariaLabel={t("settings.drop.toggle")}
        />
      </SettingsRow>

      <SettingsRow
        icon={imageCompression ? <Zap size={20} /> : <ZapOff size={20} />}
        tileClassName="border-black bg-blue-400 text-black dark:border-neutral-700 dark:bg-blue-400 dark:text-black"
        title={t("settings.images.title")}
        description={
          imageCompression
            ? t("settings.images.compress", { size: formatNumber(imageCompressionThresholdMb, locale) })
            : t("settings.images.original")
        }
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-neutral-300">
            <input
              aria-label={t("settings.images.threshold")}
              type="number"
              min={MIN_IMAGE_COMPRESSION_THRESHOLD_MB}
              max={MAX_IMAGE_COMPRESSION_THRESHOLD_MB}
              step="0.05"
              key={imageCompressionThresholdMb}
              defaultValue={imageCompressionThresholdMb}
              disabled={!imageCompression}
              onBlur={(event) => {
                const input = event.currentTarget;
                const value = Number.isFinite(input.valueAsNumber)
                  ? normalizeImageCompressionThreshold(input.valueAsNumber)
                  : imageCompressionThresholdMb;
                input.value = String(value);
                if (value !== imageCompressionThresholdMb) {
                  onImageCompressionThresholdChange(value);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="ui-input w-24 text-sm tabular-nums disabled:opacity-50"
            />
            <span>MB</span>
          </label>
          <PlayfulSwitch
            checked={imageCompression}
            onChange={() => toggleImageCompression()}
            ariaLabel={t("settings.images.toggle")}
          />
        </div>
      </SettingsRow>

      <SettingsRow
        icon={<Archive size={20} />}
        tileClassName="border-black bg-indigo-400 text-black dark:border-neutral-700 dark:bg-indigo-400 dark:text-black"
        title={t("settings.backup.exportTitle")}
      >
        <button onClick={exportBackup} className={settingsPrimaryButtonClass}>
          {t("settings.backup.export")}
        </button>
      </SettingsRow>

      <UpdateSettingsCard
        updateChannel={updateChannel}
        updateInfo={updateInfo}
        updateLoading={updateLoading}
        updateError={updateError}
        onChannelChange={onUpdateChannelChange}
        onCheckForUpdates={onCheckForUpdates}
      />
    </SettingsCard>
  );
};
