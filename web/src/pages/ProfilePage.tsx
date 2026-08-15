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
    <div className="rounded-2xl border border-cardBorder bg-cardBg/80 p-5 sm:p-6 shadow-glow-purple">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          <span className="text-neonLime">{props.title.split(' ')[0]}</span>{' '}
          {props.title.split(' ').slice(1).join(' ')}
        </h2>
        {!props.isEditing ? (
          <button
            type="button"
            onClick={props.onEdit}
            className="p-2 rounded-lg text-violet-300 hover:bg-white/5 transition"
            aria-label="Edit"
          >
            <Edit3 size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onCancel}
              className="px-4 py-2 rounded-lg border border-cardBorder text-violet-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={props.onSave}
              disabled={props.saving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {props.saving && <Loader2 size={16} className="animate-spin" />}
              <Save size={16} /> Save changes
            </button>
          </div>
        )}
      </div>
      {props.children}
    </div>
  );
}

function Field(props: {
  label: string;
  value: ReactNode;
  isEditing: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-violet-300/80 mb-1">{props.label}</p>
      {props.isEditing ? (
        props.children
      ) : (
        <p className="text-white text-sm font-medium">{props.value ?? '—'}</p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg bg-[#0c0a17] border border-cardBorder px-3 py-2.5 text-white placeholder:text-violet-300/40 focus:border-fuchsia-500 focus:outline-none transition';

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode },
) {
  return (
    <div className="relative">
      {props.icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-300/80">
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
          stroke="#1f1933"
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
            <stop offset="0%" stopColor="#22d3ee" />
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
            className="rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center text-white font-bold"
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
  isEditing: boolean;
  saving: boolean;
  onSave: (patch: Partial<ProfileSection>) => void;
  onAvatarSave: (dataUrl: string) => Promise<void>;
  onPasswordSave: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}) {
  const { data, isEditing, saving } = props;
  const [draft, setDraft] = useState<ProfileSection>(data);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState<{
    type: 'idle' | 'ok' | 'err';
    msg?: string;
  }>({ type: 'idle' });
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => setDraft(data), [data]);

  function commit() {
    props.onSave({
      fullName: draft.fullName.trim() === data.fullName ? undefined : draft.fullName,
      mobileNumber:
        (draft.mobileNumber ?? '') === (data.mobileNumber ?? '')
          ? undefined
          : draft.mobileNumber || null,
      whatsapp:
        (draft.whatsapp ?? '') === (data.whatsapp ?? '')
          ? undefined
          : draft.whatsapp || null,
    });
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800_000) {
      alert('Please pick an image under 800 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setAvatarUploading(true);
        await props.onAvatarSave(String(reader.result));
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
      setPwdStatus({ type: 'ok', msg: 'Password updated.' });
    } catch (e) {
      setPwdStatus({ type: 'err', msg: getErrorMessage(e) });
    }
  }

  return (
    <SectionCard
      title="My Profile"
      isEditing={isEditing}
      onEdit={() => setDraft(data)}
      onCancel={() => setDraft(data)}
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
          <div className="opacity-60">
            <TextInput readOnly value={data.email} icon={<Mail size={14} />} />
          </div>
        </Field>
        <Field label="Mobile Number" value={data.mobileNumber ?? 'N/A'} isEditing={isEditing}>
          <TextInput
            value={draft.mobileNumber ?? ''}
            onChange={(e) => setDraft({ ...draft, mobileNumber: e.target.value })}
            icon={<Phone size={14} />}
            placeholder="+880..."
          />
        </Field>
        <Field label="WhatsApp Number" value={data.whatsapp ?? 'N/A'} isEditing={isEditing}>
          <TextInput
            value={draft.whatsapp ?? ''}
            onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
            icon={<Phone size={14} />}
            placeholder="+880..."
          />
        </Field>

        <div className="sm:col-span-2">
          <p className="text-xs text-violet-300/80 mb-2">Profile Image</p>
          <div className="flex items-center gap-4">
            {data.avatar ? (
              <img
                src={data.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-cardBorder"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center text-white font-bold">
                {data.fullName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cardBorder text-violet-300 cursor-pointer hover:bg-white/5">
              {avatarUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Change Profile Image
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

      {/* Password change — always visible, never part of edit-mode toggle */}
      <div className="mt-8 pt-6 border-t border-cardBorder">
        <h3 className="text-fuchsia-400 font-semibold mb-4 inline-flex items-center gap-2">
          <Lock size={16} /> Password
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
              className={`text-sm ${pwdStatus.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {pwdStatus.msg}
            </span>
          )}
          <button
            type="button"
            onClick={submitPassword}
            disabled={!pwd.current || !pwd.next}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <ShieldCheck size={16} /> Change Password
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function AdditionalInfoSection(props: {
  data: AdditionalSection;
  isEditing: boolean;
  saving: boolean;
  onSave: (patch: Partial<AdditionalSection>) => void;
}) {
  const { data, isEditing, saving } = props;
  const [draft, setDraft] = useState<AdditionalSection>(data);
  useEffect(() => setDraft(data), [data]);

  function commit() {
    const patch: Partial<AdditionalSection> = {};
    (Object.keys(draft) as Array<keyof AdditionalSection>).forEach((k) => {
      if ((draft[k] ?? '') !== (data[k] ?? '')) {
        (patch as any)[k] = (draft[k] as any) || null;
      }
    });
    props.onSave(patch);
  }

  function set<K extends keyof AdditionalSection>(k: K, v: AdditionalSection[K]) {
    setDraft({ ...draft, [k]: v });
  }

  return (
    <SectionCard
      title="Additional Info"
      isEditing={isEditing}
      onEdit={() => setDraft(data)}
      onCancel={() => setDraft(data)}
      onSave={commit}
      saving={saving}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Your Gender" value={data.gender ?? '—'} isEditing={isEditing}>
          {isEditing ? (
            <div className="flex items-center gap-5 pt-2">
              {GENDERS.map((g) => (
                <label key={g} className="inline-flex items-center gap-2 text-white">
                  <input
                    type="radio"
                    name="gender"
                    className="accent-fuchsia-500"
                    checked={draft.gender === g}
                    onChange={() => set('gender', g)}
                  />
                  {g}
                </label>
              ))}
            </div>
          ) : null}
        </Field>

        <Field label="Age Range" value={data.ageRange ?? '—'} isEditing={isEditing}>
          {isEditing ? (
            <Select
              options={AGE_RANGES}
              value={draft.ageRange ?? ''}
              onChange={(e) => set('ageRange', e.target.value || null)}
              placeholder="Select range"
            />
          ) : null}
        </Field>

        <Field
          label="Primary Device Type"
          value={data.primaryDeviceType ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={DEVICE_OPTIONS}
              value={draft.primaryDeviceType ?? ''}
              onChange={(e) => set('primaryDeviceType', e.target.value || null)}
              placeholder="Select device"
            />
          ) : null}
        </Field>

        <Field
          label="Years Of Experience"
          value={data.experience ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={EXPERIENCE_OPTIONS}
              value={draft.experience ?? ''}
              onChange={(e) => set('experience', e.target.value || null)}
              placeholder="Select"
            />
          ) : null}
        </Field>

        <Field
          label="Employment Role"
          value={data.employmentRole ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={EMPLOYMENT_OPTIONS}
              value={draft.employmentRole ?? ''}
              onChange={(e) => set('employmentRole', e.target.value || null)}
              placeholder="Select role"
            />
          ) : null}
        </Field>

        <Field
          label="Area Type"
          value={data.areaType ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={AREA_OPTIONS}
              value={draft.areaType ?? ''}
              onChange={(e) => set('areaType', e.target.value || null)}
              placeholder="Select area"
            />
          ) : null}
        </Field>

        <Field
          label="Marital Status"
          value={data.maritalStatus ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={MARITAL_OPTIONS}
              value={draft.maritalStatus ?? ''}
              onChange={(e) => set('maritalStatus', e.target.value || null)}
              placeholder="Select"
            />
          ) : null}
        </Field>

        <Field
          label="Country"
          value={data.country ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={COUNTRIES}
              value={draft.country ?? ''}
              onChange={(e) => set('country', e.target.value || null)}
              placeholder="Select country"
            />
          ) : null}
        </Field>
      </div>
    </SectionCard>
  );
}

function AddressSection(props: {
  data: Addresses;
  isEditing: boolean;
  saving: boolean;
  onSave: (patch: {
    present?: Partial<AddressRow>;
    permanent?: Partial<PermanentAddressRow>;
  }) => void;
}) {
  const { data, isEditing, saving } = props;
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

  function commit() {
    props.onSave({
      present: {
        country: (draft.present.country ?? '') !== (data.present?.country ?? '')
          ? draft.present.country || null
          : undefined,
        district: (draft.present.district ?? '') !== (data.present?.district ?? '')
          ? draft.present.district || null
          : undefined,
        streetAddress:
          (draft.present.streetAddress ?? '') !== (data.present?.streetAddress ?? '')
            ? draft.present.streetAddress || null
            : undefined,
      },
      permanent: {
        sameAsPresent: draft.permanent.sameAsPresent !== data.permanent?.sameAsPresent
          ? draft.permanent.sameAsPresent
          : undefined,
        country: !draft.permanent.sameAsPresent
          ? (draft.permanent.country ?? '') !== (data.permanent?.country ?? '')
            ? draft.permanent.country || null
            : undefined
          : undefined,
        district: !draft.permanent.sameAsPresent
          ? (draft.permanent.district ?? '') !== (data.permanent?.district ?? '')
            ? draft.permanent.district || null
            : undefined
          : undefined,
        streetAddress: !draft.permanent.sameAsPresent
          ? (draft.permanent.streetAddress ?? '') !== (data.permanent?.streetAddress ?? '')
            ? draft.permanent.streetAddress || null
            : undefined
          : undefined,
      },
    });
  }

  return (
    <SectionCard
      title="Address"
      isEditing={isEditing}
      onEdit={() => setDraft(initial)}
      onCancel={() => setDraft(initial)}
      onSave={commit}
      saving={saving}
    >
      <h3 className="text-amber-400 font-semibold mb-3">Present Address</h3>
      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        <Field label="Your Country" value={data.present?.country ?? '—'} isEditing={isEditing}>
          {isEditing ? (
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
          ) : null}
        </Field>
        <Field label="District" value={data.present?.district ?? '—'} isEditing={isEditing}>
          {isEditing ? (
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
          ) : null}
        </Field>
        <Field
          label="Street Address"
          value={data.present?.streetAddress ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
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
          ) : null}
        </Field>
      </div>

      <h3 className="text-amber-400 font-semibold mb-3">Permanent Address</h3>
      {isEditing && (
        <label className="flex items-center gap-2 mb-4 text-sm text-white">
          <input
            type="checkbox"
            className="accent-fuchsia-500"
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
      {!isEditing && data.permanent?.sameAsPresent && (
        <p className="text-sm text-violet-300 mb-4">
          <CheckCircle2 size={14} className="inline mr-1 text-emerald-400" />
          Same as present address
        </p>
      )}
      {(!isEditing && !data.permanent?.sameAsPresent) ||
      (isEditing && !draft.permanent.sameAsPresent) ? (
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Your Country"
            value={data.permanent?.country ?? '—'}
            isEditing={isEditing}
          >
            {isEditing ? (
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
            ) : null}
          </Field>
          <Field
            label="District"
            value={data.permanent?.district ?? '—'}
            isEditing={isEditing}
          >
            {isEditing ? (
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
            ) : null}
          </Field>
          <Field
            label="Street Address"
            value={data.permanent?.streetAddress ?? '—'}
            isEditing={isEditing}
          >
            {isEditing ? (
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
            ) : null}
          </Field>
        </div>
      ) : null}
    </SectionCard>
  );
}

function EducationSection(props: {
  data: EducationRow[];
  isEditing: boolean;
  saving: boolean;
  onSave: (patch: Partial<Omit<EducationRow, 'id'>>) => void;
}) {
  const { data, isEditing, saving } = props;
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

  function commit() {
    props.onSave({
      educationLevel:
        (draft.educationLevel ?? '') !== (first?.educationLevel ?? '')
          ? draft.educationLevel || null
          : undefined,
      examDegreeTitle:
        (draft.examDegreeTitle ?? '') !== (first?.examDegreeTitle ?? '')
          ? draft.examDegreeTitle || null
          : undefined,
      institutionName:
        (draft.institutionName ?? '') !== (first?.institutionName ?? '')
          ? draft.institutionName || null
          : undefined,
      isCurrentlyStudying:
        draft.isCurrentlyStudying !== first?.isCurrentlyStudying
          ? draft.isCurrentlyStudying
          : undefined,
      passingYear:
        (draft.passingYear ?? null) !== (first?.passingYear ?? null)
          ? draft.passingYear ?? null
          : undefined,
      currentYear:
        (draft.currentYear ?? '') !== (first?.currentYear ?? '')
          ? draft.currentYear || null
          : undefined,
      isCseStudent:
        draft.isCseStudent !== first?.isCseStudent ? draft.isCseStudent : undefined,
    });
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
      onEdit={() =>
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
        )
      }
      onCancel={() =>
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
        )
      }
      onSave={commit}
      saving={saving}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          label="Your Education level"
          value={first?.educationLevel ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={EDUCATION_LEVELS}
              value={draft.educationLevel ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, educationLevel: e.target.value || null })
              }
              placeholder="Select your Education level"
            />
          ) : null}
        </Field>
        <Field
          label="Exam/Degree Title"
          value={first?.examDegreeTitle ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <input
              className={inputCls}
              value={draft.examDegreeTitle ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, examDegreeTitle: e.target.value })
              }
              placeholder="e.g. Computer Science and Engineering"
            />
          ) : null}
        </Field>
        <Field
          label="Institution Name"
          value={first?.institutionName ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <input
              className={inputCls}
              value={draft.institutionName ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, institutionName: e.target.value })
              }
              placeholder="Institution Name"
            />
          ) : null}
        </Field>
        <div className="hidden sm:block" />

        {isEditing && (
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-white">
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
          value={first?.passingYear ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
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
          ) : null}
        </Field>
        <Field
          label="Current Year"
          value={first?.currentYear ?? '—'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <Select
              options={CURRENT_YEARS}
              value={draft.currentYear ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, currentYear: e.target.value || null })
              }
              placeholder="3rd Year"
            />
          ) : null}
        </Field>

        <Field
          label="Are you a CSE/CS student?"
          value={first?.isCseStudent ? 'Yes' : 'No'}
          isEditing={isEditing}
        >
          {isEditing ? (
            <div className="flex items-center gap-5 pt-2">
              {[true, false].map((v) => (
                <label key={String(v)} className="inline-flex items-center gap-2 text-white">
                  <input
                    type="radio"
                    className="accent-fuchsia-500"
                    checked={!!draft.isCseStudent === v}
                    onChange={() => setDraft({ ...draft, isCseStudent: v })}
                  />
                  {v ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
          ) : null}
        </Field>
      </div>
    </SectionCard>
  );
}

function SkillSection(props: {
  data: SkillRow[];
  isEditing: boolean;
  saving: boolean;
  onSave: (skills: Array<Partial<SkillRow> & { skillName: string }>) => void;
}) {
  const { data, isEditing, saving } = props;
  const [draft, setDraft] = useState<SkillRow[]>(data);
  useEffect(() => setDraft(data), [data]);

  function commit() {
    props.onSave(draft.map((s) => ({
      id: s.id,
      skillName: s.skillName,
      experienceInYear: s.experienceInYear,
      projectLinks: s.projectLinks,
    })));
  }

  return (
    <SectionCard
      title="Skill Set"
      isEditing={isEditing}
      onEdit={() => setDraft(data)}
      onCancel={() => setDraft(data)}
      onSave={commit}
      saving={saving}
    >
      {!isEditing && data.length === 0 && (
        <p className="text-violet-300/80 text-sm">No skills added yet.</p>
      )}
      {!isEditing && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-cardBorder bg-[#0c0a17] px-4 py-3"
            >
              <span className="text-white font-medium">{s.skillName}</span>
              <span className="text-violet-300 text-sm">
                {s.experienceInYear ?? '—'} {s.experienceInYear ? 'yr' : ''}
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
              className="rounded-lg border border-cardBorder bg-[#0c0a17] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-fuchsia-300 font-semibold inline-flex items-center gap-2">
                  <Sparkles size={14} /> {i === 0 ? 'Add a Skill' : `Skill ${i + 1}`}
                </h4>
                {draft.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-violet-300 hover:text-rose-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-violet-300/80 mb-1">Skill Name</p>
                  <input
                    list="popular-skills"
                    className={inputCls}
                    value={s.skillName}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], skillName: e.target.value };
                      setDraft(next);
                    }}
                    placeholder="React"
                  />
                </div>
                <div>
                  <p className="text-xs text-violet-300/80 mb-1">Experience in Year</p>
                  <Select
                    options={EXPERIENCE_OPTIONS}
                    value={s.experienceInYear ?? ''}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], experienceInYear: e.target.value || null };
                      setDraft(next);
                    }}
                    placeholder="None"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-violet-300/80 mb-1">Project links</p>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={s.projectLinks ?? ''}
                  onChange={(e) => {
                    const next = [...draft];
                    next[i] = { ...next[i], projectLinks: e.target.value };
                    setDraft(next);
                  }}
                  placeholder="https://github.com/me/project"
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
            className="w-full py-2 rounded-lg border border-dashed border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"
          >
            + Add Skill
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
            className="h-32 rounded-2xl bg-white/5 animate-pulse"
            aria-label="Loading"
          />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-cardBorder bg-cardBg/80 p-6 text-rose-400">
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
      <aside className="rounded-2xl border border-cardBorder bg-cardBg/80 p-5 h-fit">
        <div className="flex flex-col items-center text-center">
          <CompletionRing
            percent={completion}
            src={data.profile.avatar}
            alt={data.profile.fullName}
          />
          <h2 className="mt-4 text-lg font-bold text-fuchsia-300">
            {data.profile.fullName}
          </h2>
          <p className="text-violet-300 text-xs mt-1">
            {data.profile.email}
          </p>
          <p className="text-violet-300 text-xs">
            {data.profile.mobileNumber ?? '—'}
          </p>
          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-violet-300">Complete your profile</span>
              <span className="text-fuchsia-400 font-semibold">
                {completion}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1a1530] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="my-5 border-t border-cardBorder" />

        <nav className="space-y-1">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                  active
                    ? 'bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300 border-l-2 border-fuchsia-500'
                    : 'text-violet-300 hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{t.label}</span>
                {sectionFilled[t.key] ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : active ? (
                  <CheckCircle2 size={16} className="text-violet-400" />
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
                isEditing
                saving={saving}
                onSave={async (patch) => {
                  await update({ profile: patch });
                  await refresh();
                }}
                onAvatarSave={async (avatar) => {
                  await update({ profile: { avatar } });
                  await refresh();
                }}
                onPasswordSave={async (currentPassword, newPassword) => {
                  const { profileApi } = await import('../modules/profile/profileApi');
                  await profileApi.changePassword(currentPassword, newPassword);
                }}
              />
            )}
            {activeTab === 'additional' && (
              <AdditionalInfoSection
                data={data.additional}
                isEditing
                saving={saving}
                onSave={async (patch) => {
                  await update({ additional: patch });
                }}
              />
            )}
            {activeTab === 'address' && (
              <AddressSection
                data={data.addresses}
                isEditing
                saving={saving}
                onSave={async (patch) => {
                  await update({ addresses: patch });
                }}
              />
            )}
            {activeTab === 'education' && (
              <EducationSection
                data={data.educations}
                isEditing
                saving={saving}
                onSave={async (patch) => {
                  await update({ educations: patch });
                }}
              />
            )}
            {activeTab === 'skill' && (
              <SkillSection
                data={data.skills}
                isEditing
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
