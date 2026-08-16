import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useProfile } from '../modules/profile/useProfile';
import type {
  AdditionalSection,
  Addresses,
  AddressRow,
  EducationRow,
  PermanentAddressRow,
  ProfileSection,
  SkillRow,
} from '../modules/profile/profileApi';
import { profileApi } from '../modules/profile/profileApi';
import { getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type TabKey = 'profile' | 'additional' | 'address' | 'education' | 'skill';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'profile', label: 'My Profile' },
  { key: 'additional', label: 'Additional Info' },
  { key: 'address', label: 'Address' },
  { key: 'education', label: 'Education' },
  { key: 'skill', label: 'Skill Set' },
];

const COUNTRIES = [
  'Bangladesh',
  'India',
  'Pakistan',
  'Nepal',
  'Sri Lanka',
  'Other',
];

const AGE_RANGES = ['Under 18', '18-20', '20-25', '26-30', '31-35', '36+'];
const CURRENT_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const EXPERIENCE_OPTIONS = ['None', '1', '2', '3', '4', '5+'];
const DEVICE_OPTIONS = ['Laptop', 'Mobile', 'Tablet', 'Desktop'];
const AREA_OPTIONS = ['Urban', 'Town', 'Rural'];
const EMPLOYMENT_OPTIONS = ['Student', 'Freelancer', 'Employee', 'Founder', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_OPTIONS = ['Single', 'Married', 'Other'];
const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'MongoDB',
  'PostgreSQL',
  'Figma',
  'Tailwind',
  'Next.js',
  'GraphQL',
];

/* ─── shared bits ───────────────────────────────────────────────────────── */

function SectionCard(props: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-purple-200/60 dark:border-cardBorder/40">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {props.title}
        </h2>
        {!props.isEditing ? (
          <button
            type="button"
            onClick={props.onEdit}
            className="p-2 rounded-lg text-purple-700 dark:text-violet-300 hover:bg-purple-500/10 dark:hover:bg-white/10 transition"
            aria-label="Edit section"
            title="Edit"
          >
            <Edit3 size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={props.onCancel}
            className="p-2 rounded-lg text-purple-700 dark:text-violet-300 hover:bg-purple-500/10 dark:hover:bg-white/10 transition"
            aria-label="Cancel editing"
            title="Cancel"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {props.children}

      {props.isEditing && (
        <div className="mt-6 pt-4 border-t border-purple-200/60 dark:border-cardBorder/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={props.onCancel}
            className="px-4 py-2 rounded-lg border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 hover:bg-purple-500/10 dark:hover:bg-white/5 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.saving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 transition shadow-md"
          >
            {props.saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} /> Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: ReactNode;
  isEditing: boolean;
  emptyText?: string;
  children?: ReactNode;
}) {
  const rawValue = props.value;
  const hasValue =
    rawValue !== null &&
    rawValue !== undefined &&
    rawValue !== '' &&
    rawValue !== '—';

  return (
    <div>
      <p className="text-xs text-slate-600 dark:text-violet-300/80 mb-1 font-medium">{props.label}</p>
      {props.isEditing ? (
        props.children
      ) : (
        <p className={`text-sm font-semibold ${hasValue ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-violet-400/50 italic font-normal'}`}>
          {hasValue ? rawValue : (props.emptyText ?? 'Not provided')}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-violet-300/40 focus:border-purple-500 focus:outline-none transition';

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode },
) {
  return (
    <div className="relative">
      {props.icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-violet-300/80">
          {props.icon}
        </div>
      )}
      <input
        {...props}
        className={`${inputCls} ${props.icon ? 'pl-9' : ''} ${props.className ?? ''}`}
      />
    </div>
  );
}

function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: string[];
    placeholder?: string;
  },
) {
  return (
    <select
      {...props}
      className={`${inputCls} ${props.className ?? ''}`}
      value={props.value ?? ''}
    >
      {props.placeholder !== undefined && (
        <option value="">{props.placeholder}</option>
      )}
      {props.options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ─── completion ring ───────────────────────────────────────────────────── */

function CompletionRing({
  percent,
  size = 132,
  stroke = 8,
  src,
  alt,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  src?: string | null;
  alt?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#cbd5e1"
          className="dark:stroke-[#1f1933]"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {src ? (
          <img
            src={src}
            alt={alt ?? 'Avatar'}
            className="rounded-full object-cover"
            style={{ width: size - stroke * 2.5, height: size - stroke * 2.5 }}
          />
        ) : (
          <div
            className="rounded-full bg-gradient-to-br from-purple-600 to-sky-500 grid place-items-center text-white font-bold text-xl"
            style={{ width: size - stroke * 2.5, height: size - stroke * 2.5 }}
          >
            {alt?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── per-section editors ───────────────────────────────────────────────── */

function MyProfileSection(props: {
  data: ProfileSection;
  saving: boolean;
  onSave: (patch: Partial<ProfileSection>) => Promise<void>;
  onAvatarSave: (dataUrl: string) => Promise<void>;
  onPasswordSave: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}) {
  const { data, saving } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileSection>(data);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState<{
    type: 'idle' | 'ok' | 'err';
    msg?: string;
  }>({ type: 'idle' });
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => setDraft(data), [data]);

  async function commit() {
    await props.onSave({
      fullName: draft.fullName.trim() === data.fullName ? undefined : draft.fullName,
      mobileNumber: draft.mobileNumber || null,
      whatsapp: draft.whatsapp || null,
    });
    setIsEditing(false);
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) {
      alert('Please pick an image under 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setAvatarUploading(true);
        await props.onAvatarSave(String(reader.result));
      } catch (err: any) {
        alert('Failed to update avatar: ' + getErrorMessage(err));
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function submitPassword() {
    setPwdStatus({ type: 'idle' });
    if (pwd.next.length < 8) {
      setPwdStatus({ type: 'err', msg: 'New password must be 8+ chars.' });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdStatus({ type: 'err', msg: 'Passwords do not match.' });
      return;
    }
    try {
      await props.onPasswordSave(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      setPwdStatus({ type: 'ok', msg: 'Password updated successfully.' });
    } catch (e) {
      setPwdStatus({ type: 'err', msg: getErrorMessage(e) });
    }
  }

  return (
    <SectionCard
      title="My Profile"
      isEditing={isEditing}
      onEdit={() => {
        setDraft(data);
        setIsEditing(true);
      }}
      onCancel={() => {
        setDraft(data);
        setIsEditing(false);
      }}
      onSave={commit}
      saving={saving}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Full Name" isEditing={isEditing} value={data.fullName}>
          <input
            className={inputCls}
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
          />
        </Field>

        <Field label="Email" value={data.email} isEditing={false}>
          <div className="opacity-70">
            <TextInput readOnly value={data.email} icon={<Mail size={14} />} />
          </div>
        </Field>

        <Field
          label="Mobile Number"
          value={data.mobileNumber}
          emptyText="Add Mobile Number"
          isEditing={isEditing}
        >
          <TextInput
            value={draft.mobileNumber ?? ''}
            onChange={(e) => setDraft({ ...draft, mobileNumber: e.target.value })}
            icon={<Phone size={14} />}
            placeholder="+880..."
          />
        </Field>

        <Field
          label="WhatsApp Number"
          value={data.whatsapp}
          emptyText="Add WhatsApp Number"
          isEditing={isEditing}
        >
          <TextInput
            value={draft.whatsapp ?? ''}
            onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
            icon={<Phone size={14} />}
            placeholder="+880..."
          />
        </Field>

        <div className="sm:col-span-2">
          <p className="text-xs text-slate-600 dark:text-violet-300/80 mb-2 font-medium">Profile Image</p>
          <div className="flex items-center gap-4">
            {data.avatar ? (
              <img
                src={data.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-300 dark:border-cardBorder shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-sky-500 grid place-items-center text-white font-bold text-2xl shadow-md">
                {data.fullName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-300 dark:border-cardBorder text-purple-700 dark:text-violet-300 cursor-pointer hover:bg-purple-500/10 dark:hover:bg-white/5 transition font-medium text-sm">
              {avatarUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {data.avatar ? 'Change Profile Image' : 'Upload Profile Image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Password change — only visible in edit mode */}
      {isEditing && (
        <div className="mt-8 pt-6 border-t border-purple-200/60 dark:border-cardBorder">
          <h3 className="text-purple-700 dark:text-fuchsia-400 font-bold mb-4 inline-flex items-center gap-2 text-base">
            <Lock size={16} /> Password Change
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Current Password" value="" isEditing>
              <input
                type="password"
                className={inputCls}
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                placeholder="Current Password"
              />
            </Field>
            <div className="hidden sm:block" />
            <Field label="New Password" value="" isEditing>
              <input
                type="password"
                className={inputCls}
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                placeholder="New Password"
              />
            </Field>
            <Field label="Confirm New Password" value="" isEditing>
              <input
                type="password"
                className={inputCls}
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                placeholder="Retype Password"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-3 items-center">
            {pwdStatus.type !== 'idle' && (
              <span
                className={`text-sm font-medium ${pwdStatus.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
              >
                {pwdStatus.msg}
              </span>
            )}
            <button
              type="button"
              onClick={submitPassword}
              disabled={!pwd.current || !pwd.next}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-sky-600 text-white font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 text-sm shadow-md"
            >
              <ShieldCheck size={16} /> Update Password
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function AdditionalInfoSection(props: {
  data: AdditionalSection;
  saving: boolean;
  onSave: (patch: Partial<AdditionalSection>) => Promise<void>;
}) {
  const { data, saving } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<AdditionalSection>(data);
  useEffect(() => setDraft(data), [data]);

  async function commit() {
    const patch: Partial<AdditionalSection> = {};
    (Object.keys(draft) as Array<keyof AdditionalSection>).forEach((k) => {
      (patch as any)[k] = (draft[k] as any) || null;
    });
    await props.onSave(patch);
    setIsEditing(false);
  }

  function set<K extends keyof AdditionalSection>(k: K, v: AdditionalSection[K]) {
    setDraft({ ...draft, [k]: v });
  }

  return (
    <SectionCard
      title="Additional Info"
      isEditing={isEditing}
      onEdit={() => {
        setDraft(data);
        setIsEditing(true);
      }}
      onCancel={() => {
        setDraft(data);
        setIsEditing(false);
      }}
      onSave={commit}
      saving={saving}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Your Gender" value={data.gender} emptyText="Select your Gender" isEditing={isEditing}>
          <div className="flex items-center gap-5 pt-2">
            {GENDERS.map((g) => (
              <label key={g} className="inline-flex items-center gap-2 text-slate-900 dark:text-white text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  className="accent-purple-600"
                  checked={draft.gender === g}
                  onChange={() => set('gender', g)}
                />
                {g}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Age Range" value={data.ageRange} emptyText="Select Age Range" isEditing={isEditing}>
          <Select
            options={AGE_RANGES}
            value={draft.ageRange ?? ''}
            onChange={(e) => set('ageRange', e.target.value || null)}
            placeholder="Select range"
          />
        </Field>

        <Field
          label="Primary Device Type"
          value={data.primaryDeviceType}
          emptyText="Select Primary Device"
          isEditing={isEditing}
        >
          <Select
            options={DEVICE_OPTIONS}
            value={draft.primaryDeviceType ?? ''}
            onChange={(e) => set('primaryDeviceType', e.target.value || null)}
            placeholder="Select device"
          />
        </Field>

        <Field
          label="Years Of Experience"
          value={data.experience}
          emptyText="Select Experience"
          isEditing={isEditing}
        >
          <Select
            options={EXPERIENCE_OPTIONS}
            value={draft.experience ?? ''}
            onChange={(e) => set('experience', e.target.value || null)}
            placeholder="Select"
          />
        </Field>

        <Field
          label="Employment Role"
          value={data.employmentRole}
          emptyText="Select Employment Role"
          isEditing={isEditing}
        >
          <Select
            options={EMPLOYMENT_OPTIONS}
            value={draft.employmentRole ?? ''}
            onChange={(e) => set('employmentRole', e.target.value || null)}
            placeholder="Select role"
          />
        </Field>

        <Field
          label="Area Type"
          value={data.areaType}
          emptyText="Select Area Type"
          isEditing={isEditing}
        >
          <Select
            options={AREA_OPTIONS}
            value={draft.areaType ?? ''}
            onChange={(e) => set('areaType', e.target.value || null)}
            placeholder="Select area"
          />
        </Field>

        <Field
          label="Marital Status"
          value={data.maritalStatus}
          emptyText="Select Marital Status"
          isEditing={isEditing}
        >
          <Select
            options={MARITAL_OPTIONS}
            value={draft.maritalStatus ?? ''}
            onChange={(e) => set('maritalStatus', e.target.value || null)}
            placeholder="Select"
          />
        </Field>

        <Field
          label="Country"
          value={data.country}
          emptyText="Select Country"
          isEditing={isEditing}
        >
          <Select
            options={COUNTRIES}
            value={draft.country ?? ''}
            onChange={(e) => set('country', e.target.value || null)}
            placeholder="Select country"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

function AddressSection(props: {
  data: Addresses;
  saving: boolean;
  onSave: (patch: {
    present?: Partial<AddressRow>;
    permanent?: Partial<PermanentAddressRow>;
  }) => Promise<void>;
}) {
  const { data, saving } = props;
  const [isEditing, setIsEditing] = useState(false);

  const initial = useMemo(
    () => ({
      present: data.present ?? { country: null, district: null, streetAddress: null },
      permanent: data.permanent ?? {
        country: null,
        district: null,
        streetAddress: null,
        sameAsPresent: false,
      },
    }),
    [data],
  );
  const [draft, setDraft] = useState(initial);

  useEffect(() => setDraft(initial), [initial]);

  async function commit() {
    await props.onSave({
      present: {
        country: draft.present.country || null,
        district: draft.present.district || null,
        streetAddress: draft.present.streetAddress || null,
      },
      permanent: {
        sameAsPresent: draft.permanent.sameAsPresent,
        country: !draft.permanent.sameAsPresent ? draft.permanent.country || null : undefined,
        district: !draft.permanent.sameAsPresent ? draft.permanent.district || null : undefined,
        streetAddress: !draft.permanent.sameAsPresent ? draft.permanent.streetAddress || null : undefined,
      },
    });
    setIsEditing(false);
  }

  return (
    <SectionCard
      title="Address"
      isEditing={isEditing}
      onEdit={() => {
        setDraft(initial);
        setIsEditing(true);
      }}
      onCancel={() => {
        setDraft(initial);
        setIsEditing(false);
      }}
      onSave={commit}
      saving={saving}
    >
      <h3 className="text-amber-600 dark:text-amber-400 font-bold mb-4 text-base">Present Address</h3>
      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        <Field label="Your Country" value={data.present?.country} emptyText="Add your Country" isEditing={isEditing}>
          <Select
            options={COUNTRIES}
            value={draft.present.country ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                present: { ...draft.present, country: e.target.value || null },
              })
            }
            placeholder="Select your Country"
          />
        </Field>

        <Field label="District" value={data.present?.district} emptyText="Add District" isEditing={isEditing}>
          <input
            className={inputCls}
            value={draft.present.district ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                present: { ...draft.present, district: e.target.value },
              })
            }
            placeholder="Select District"
          />
        </Field>

        <Field
          label="Street Address"
          value={data.present?.streetAddress}
          emptyText="Add Street Address"
          isEditing={isEditing}
        >
          <input
            className={inputCls}
            value={draft.present.streetAddress ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                present: { ...draft.present, streetAddress: e.target.value },
              })
            }
            placeholder="Street / House / Area"
          />
        </Field>
      </div>

      <h3 className="text-amber-600 dark:text-amber-400 font-bold mb-4 text-base">Permanent Address</h3>
      {isEditing && (
        <label className="flex items-center gap-2 mb-4 text-sm text-slate-900 dark:text-white font-medium cursor-pointer">
          <input
            type="checkbox"
            className="accent-purple-600"
            checked={draft.permanent.sameAsPresent}
            onChange={(e) =>
              setDraft({
                ...draft,
                permanent: { ...draft.permanent, sameAsPresent: e.target.checked },
              })
            }
          />
          Current address and permanent address are the same
        </label>
      )}

      {!isEditing && data.permanent?.sameAsPresent ? (
        <div className="rounded-xl border border-purple-200 dark:border-cardBorder bg-purple-50/70 dark:bg-[#0c0a17] p-3 text-sm text-slate-800 dark:text-violet-300 flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          Same as present address
        </div>
      ) : (!isEditing && !data.permanent?.sameAsPresent) || (isEditing && !draft.permanent.sameAsPresent) ? (
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Your Country"
            value={data.permanent?.country}
            emptyText="Add your Country"
            isEditing={isEditing}
          >
            <Select
              options={COUNTRIES}
              value={draft.permanent.country ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  permanent: { ...draft.permanent, country: e.target.value || null },
                })
              }
              placeholder="Select your Country"
            />
          </Field>
          <Field
            label="District"
            value={data.permanent?.district}
            emptyText="Add District"
            isEditing={isEditing}
          >
            <input
              className={inputCls}
              value={draft.permanent.district ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  permanent: { ...draft.permanent, district: e.target.value },
                })
              }
              placeholder="Select District"
            />
          </Field>
          <Field
            label="Street Address"
            value={data.permanent?.streetAddress}
            emptyText="Add Street Address"
            isEditing={isEditing}
          >
            <input
              className={inputCls}
              value={draft.permanent.streetAddress ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  permanent: { ...draft.permanent, streetAddress: e.target.value },
                })
              }
              placeholder="Street / House / Area"
            />
          </Field>
        </div>
      ) : null}
    </SectionCard>
  );
}

function EducationSection(props: {
  data: EducationRow[];
  saving: boolean;
  onSave: (patch: Partial<Omit<EducationRow, 'id'>>) => Promise<void>;
}) {
  const { data, saving } = props;
  const [isEditing, setIsEditing] = useState(false);
  const first = data[0];
  const [draft, setDraft] = useState<Partial<EducationRow>>(
    first ?? {
      educationLevel: null,
      examDegreeTitle: null,
      institutionName: null,
      isCurrentlyStudying: false,
      passingYear: null,
      currentYear: null,
      isCseStudent: false,
    },
  );

  useEffect(() => {
    setDraft(
      first ?? {
        educationLevel: null,
        examDegreeTitle: null,
        institutionName: null,
        isCurrentlyStudying: false,
        passingYear: null,
        currentYear: null,
        isCseStudent: false,
      },
    );
  }, [first]);

  async function commit() {
    await props.onSave({
      educationLevel: draft.educationLevel || null,
      examDegreeTitle: draft.examDegreeTitle || null,
      institutionName: draft.institutionName || null,
      isCurrentlyStudying: !!draft.isCurrentlyStudying,
      passingYear: draft.passingYear ?? null,
      currentYear: draft.currentYear || null,
      isCseStudent: !!draft.isCseStudent,
    });
    setIsEditing(false);
  }

  const EDUCATION_LEVELS = [
    'SSC',
    'HSC',
    'Bachelor/Honors',
    'Masters',
    'PhD',
    'Diploma',
    'Other',
  ];

  return (
    <SectionCard
      title="Education"
      isEditing={isEditing}
      onEdit={() => {
        setDraft(first ?? {});
        setIsEditing(true);
      }}
      onCancel={() => {
        setDraft(first ?? {});
        setIsEditing(false);
      }}
      onSave={commit}
      saving={saving}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          label="Your Education level"
          value={first?.educationLevel}
          emptyText="Add Education Level"
          isEditing={isEditing}
        >
          <Select
            options={EDUCATION_LEVELS}
            value={draft.educationLevel ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, educationLevel: e.target.value || null })
            }
            placeholder="Select your Education level"
          />
        </Field>

        <Field
          label="Exam/Degree Title"
          value={first?.examDegreeTitle}
          emptyText="Add Exam/Degree Title"
          isEditing={isEditing}
        >
          <input
            className={inputCls}
            value={draft.examDegreeTitle ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, examDegreeTitle: e.target.value })
            }
            placeholder="e.g. Computer Science and Engineering"
          />
        </Field>

        <Field
          label="Institution Name"
          value={first?.institutionName}
          emptyText="Add Institution Name"
          isEditing={isEditing}
        >
          <input
            className={inputCls}
            value={draft.institutionName ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, institutionName: e.target.value })
            }
            placeholder="Institution Name"
          />
        </Field>

        <div className="hidden sm:block" />

        {isEditing && (
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-900 dark:text-white font-medium cursor-pointer">
            <input
              type="checkbox"
              className="accent-emerald-500"
              checked={!!draft.isCurrentlyStudying}
              onChange={(e) =>
                setDraft({ ...draft, isCurrentlyStudying: e.target.checked })
              }
            />
            I'm Currently Studying
          </label>
        )}

        <Field
          label="Approximate Passing Year"
          value={first?.passingYear}
          emptyText="Add Passing Year"
          isEditing={isEditing}
        >
          <input
            type="number"
            className={inputCls}
            value={draft.passingYear ?? ''}
            min={1950}
            max={2100}
            onChange={(e) =>
              setDraft({
                ...draft,
                passingYear: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="2027"
          />
        </Field>

        <Field
          label="Current Year"
          value={first?.currentYear}
          emptyText="Add Current Year"
          isEditing={isEditing}
        >
          <Select
            options={CURRENT_YEARS}
            value={draft.currentYear ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, currentYear: e.target.value || null })
            }
            placeholder="3rd Year"
          />
        </Field>

        <Field
          label="Are you a CSE/CS student?"
          value={first ? (first.isCseStudent ? 'Yes' : 'No') : null}
          emptyText="Select CSE/CS status"
          isEditing={isEditing}
        >
          <div className="flex items-center gap-5 pt-2">
            {[true, false].map((v) => (
              <label key={String(v)} className="inline-flex items-center gap-2 text-slate-900 dark:text-white text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="isCse"
                  className="accent-purple-600"
                  checked={!!draft.isCseStudent === v}
                  onChange={() => setDraft({ ...draft, isCseStudent: v })}
                />
                {v ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </SectionCard>
  );
}

function SkillSection(props: {
  data: SkillRow[];
  saving: boolean;
  onSave: (skills: Array<Partial<SkillRow> & { skillName: string }>) => Promise<void>;
}) {
  const { data, saving } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<SkillRow[]>(data);
  useEffect(() => setDraft(data), [data]);

  async function commit() {
    await props.onSave(draft.map((s) => ({
      id: s.id,
      skillName: s.skillName,
      experienceInYear: s.experienceInYear,
      projectLinks: s.projectLinks,
    })));
    setIsEditing(false);
  }

  return (
    <SectionCard
      title="Skill Set"
      isEditing={isEditing}
      onEdit={() => {
        setDraft(data);
        setIsEditing(true);
      }}
      onCancel={() => {
        setDraft(data);
        setIsEditing(false);
      }}
      onSave={commit}
      saving={saving}
    >
      {!isEditing && data.length === 0 && (
        <p className="text-slate-400 dark:text-violet-400/60 italic text-sm">No skills added yet. Click edit to add your skill set.</p>
      )}

      {!isEditing && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((s) => (
            <li
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-purple-200/80 dark:border-cardBorder bg-purple-50/60 dark:bg-[#0c0a17] px-4 py-3 shadow-sm"
            >
              <div>
                <span className="text-slate-900 dark:text-white font-bold text-base">{s.skillName}</span>
                {s.projectLinks && (
                  <p className="text-xs text-purple-700 dark:text-fuchsia-300/80 truncate mt-0.5 max-w-md font-medium">
                    {s.projectLinks}
                  </p>
                )}
              </div>
              <span className="text-purple-800 dark:text-violet-300 text-xs sm:text-sm font-semibold shrink-0 bg-purple-500/15 px-3 py-1 rounded-lg border border-purple-500/20">
                {s.experienceInYear ? `${s.experienceInYear} ${Number(s.experienceInYear) === 1 ? 'Year' : 'Years'} Exp` : 'No experience set'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isEditing && (
        <div className="space-y-4">
          {draft.map((s, i) => (
            <div
              key={s.id ?? `new-${i}`}
              className="rounded-xl border border-purple-200/80 dark:border-cardBorder bg-slate-100/80 dark:bg-[#0c0a17] p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-purple-700 dark:text-fuchsia-300 font-bold inline-flex items-center gap-2 text-sm">
                  <Sparkles size={14} /> {i === 0 ? 'Skill Details' : `Skill ${i + 1}`}
                </h4>
                {draft.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-slate-500 dark:text-violet-300 hover:text-rose-500 transition"
                    title="Remove skill"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-violet-300/80 mb-1 font-medium">Skill Name</p>
                  <input
                    list="popular-skills"
                    className={inputCls}
                    value={s.skillName}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], skillName: e.target.value };
                      setDraft(next);
                    }}
                    placeholder="React, TypeScript, Python..."
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-violet-300/80 mb-1 font-medium">Experience in Year</p>
                  <Select
                    options={EXPERIENCE_OPTIONS}
                    value={s.experienceInYear ?? ''}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], experienceInYear: e.target.value || null };
                      setDraft(next);
                    }}
                    placeholder="Select experience"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-violet-300/80 mb-1 font-medium">Project links</p>
                <textarea
                  className={`${inputCls} min-h-[70px] text-xs`}
                  value={s.projectLinks ?? ''}
                  onChange={(e) => {
                    const next = [...draft];
                    next[i] = { ...next[i], projectLinks: e.target.value };
                    setDraft(next);
                  }}
                  placeholder="https://github.com/myusername/project"
                />
              </div>
            </div>
          ))}

          <datalist id="popular-skills">
            {POPULAR_SKILLS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <button
            type="button"
            onClick={() =>
              setDraft([
                ...draft,
                {
                  id: '',
                  skillName: '',
                  experienceInYear: null,
                  projectLinks: null,
                },
              ])
            }
            className="w-full py-2.5 rounded-xl border border-dashed border-purple-400 dark:border-fuchsia-500/40 text-purple-700 dark:text-fuchsia-300 text-sm font-semibold hover:bg-purple-500/10 transition"
          >
            + Add New Skill
          </button>
        </div>
      )}
    </SectionCard>
  );
}

/* ─── main page ─────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { data, loading, saving, error, update } = useProfile();
  const { refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
            aria-label="Loading"
          />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-cardBorder bg-rose-50 dark:bg-cardBg/80 p-6 text-rose-600 dark:text-rose-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const completion = data.completion;
  const sectionFilled = {
    profile: !!(
      data.profile.fullName &&
      data.profile.mobileNumber &&
      data.profile.whatsapp &&
      data.profile.avatar
    ),
    additional: !!(
      data.additional.gender &&
      data.additional.ageRange &&
      data.additional.primaryDeviceType &&
      data.additional.experience &&
      data.additional.employmentRole &&
      data.additional.areaType &&
      data.additional.maritalStatus &&
      data.additional.country
    ),
    address: !!(
      data.addresses.present?.country &&
      data.addresses.present?.district &&
      data.addresses.present?.streetAddress &&
      (data.addresses.permanent?.sameAsPresent ||
        (data.addresses.permanent?.country &&
          data.addresses.permanent?.district &&
          data.addresses.permanent?.streetAddress))
    ),
    education: (() => {
      const e = data.educations[0];
      return !!(
        e &&
        e.educationLevel &&
        e.examDegreeTitle &&
        e.institutionName &&
        (e.isCurrentlyStudying || e.passingYear) &&
        typeof e.isCseStudent === 'boolean'
      );
    })(),
    skill: data.skills.some(
      (s) => !!s.skillName?.trim() && !!s.experienceInYear,
    ),
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* ─── Left sidebar ────────────────────────────────────────────────── */}
      <aside className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 h-fit shadow-md">
        <div className="flex flex-col items-center text-center">
          <CompletionRing
            percent={completion}
            src={data.profile.avatar}
            alt={data.profile.fullName}
          />
          <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-fuchsia-300">
            {data.profile.fullName}
          </h2>
          <p className="text-slate-600 dark:text-violet-300 text-xs mt-1 font-medium">
            {data.profile.email}
          </p>
          <p className="text-slate-600 dark:text-violet-300 text-xs font-medium">
            {data.profile.mobileNumber ?? '—'}
          </p>
          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-600 dark:text-violet-300">Complete your profile</span>
              <span className="text-purple-700 dark:text-fuchsia-400 font-extrabold">
                {completion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-[#1a1530] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="my-5 border-t border-purple-200/70 dark:border-cardBorder" />

        <nav className="space-y-1">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/20 via-purple-500/15 to-indigo-500/10 text-purple-900 dark:text-fuchsia-300 border-l-4 border-purple-600 dark:border-fuchsia-500 font-bold shadow-sm'
                    : 'text-slate-700 dark:text-violet-300 hover:bg-purple-500/10 dark:hover:bg-white/5 font-medium'
                }`}
              >
                <span className="text-sm">{t.label}</span>
                {sectionFilled[t.key] ? (
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
                ) : active ? (
                  <CheckCircle2 size={16} className="text-purple-600 dark:text-violet-400" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Right pane ─────────────────────────────────────────────────── */}
      <main className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'profile' && (
              <MyProfileSection
                data={data.profile}
                saving={saving}
                onSave={async (patch) => {
                  await update({ profile: patch });
                  await refresh();
                }}
                onAvatarSave={async (avatar) => {
                  await profileApi.setAvatar(avatar);
                  await update({ profile: { avatar } });
                  await refresh();
                }}
                onPasswordSave={async (currentPassword, newPassword) => {
                  await profileApi.changePassword(currentPassword, newPassword);
                }}
              />
            )}

            {activeTab === 'additional' && (
              <AdditionalInfoSection
                data={data.additional}
                saving={saving}
                onSave={async (patch) => {
                  await update({ additional: patch });
                }}
              />
            )}

            {activeTab === 'address' && (
              <AddressSection
                data={data.addresses}
                saving={saving}
                onSave={async (patch) => {
                  await update({ addresses: patch });
                }}
              />
            )}

            {activeTab === 'education' && (
              <EducationSection
                data={data.educations}
                saving={saving}
                onSave={async (patch) => {
                  await update({ educations: patch });
                }}
              />
            )}

            {activeTab === 'skill' && (
              <SkillSection
                data={data.skills}
                saving={saving}
                onSave={async (skills) => {
                  await update({ skills: { skills } });
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
