import { api } from '../../lib/api';

export type ProfileSection = {
  fullName: string;
  email: string;
  avatar: string | null;
  mobileNumber: string | null;
  whatsapp: string | null;
};

export type AdditionalSection = {
  gender: string | null;
  ageRange: string | null;
  primaryDeviceType: string | null;
  experience: string | null;
  role: string | null;
  employmentRole: string | null;
  areaType: string | null;
  maritalStatus: string | null;
  country: string | null;
};

export type AddressRow = {
  country: string | null;
  district: string | null;
  streetAddress: string | null;
};

export type PermanentAddressRow = AddressRow & { sameAsPresent: boolean };

export type Addresses = {
  present: AddressRow | null;
  permanent: PermanentAddressRow | null;
};

export type EducationRow = {
  id: string;
  educationLevel: string | null;
  examDegreeTitle: string | null;
  institutionName: string | null;
  isCurrentlyStudying: boolean;
  passingYear: number | null;
  currentYear: string | null;
  isCseStudent: boolean;
};

export type SkillRow = {
  id: string;
  skillName: string;
  experienceInYear: string | null;
  projectLinks: string | null;
};

export type ProfileV2 = {
  profile: ProfileSection;
  additional: AdditionalSection;
  addresses: Addresses;
  educations: EducationRow[];
  skills: SkillRow[];
  completion: number;
};

export type ProfileV2Update = Partial<{
  profile: Partial<ProfileSection>;
  additional: Partial<AdditionalSection>;
  addresses: {
    present?: Partial<AddressRow>;
    permanent?: Partial<PermanentAddressRow>;
  };
  educations: Partial<Omit<EducationRow, 'id'>>;
  skills: { skills: Array<Partial<SkillRow> & { skillName: string }> };
}>;

export const profileApi = {
  get: () =>
    api.get<ProfileV2>('/api/user/profile-v2').then((r) => r.data),

  update: (data: ProfileV2Update) =>
    api.put<ProfileV2>('/api/user/profile-v2', data).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .patch<{ ok: true }>('/api/user/profile-v2/password', {
        currentPassword,
        newPassword,
      })
      .then((r) => r.data),

  setAvatar: (avatar: string) =>
    api
      .patch<{ avatar: string }>('/api/user/profile-v2/avatar', { avatar })
      .then((r) => r.data),
};
