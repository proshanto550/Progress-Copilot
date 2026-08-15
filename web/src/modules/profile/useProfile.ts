import { useCallback, useEffect, useState } from 'react';
import { profileApi, type ProfileV2, type ProfileV2Update } from './profileApi';
import { getErrorMessage } from '../../lib/api';

export function useProfile() {
  const [data, setData] = useState<ProfileV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const fresh = await profileApi.get();
      setData(fresh);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Optimistic save — `update` returns the canonical post-save payload. */
  const update = useCallback(async (patch: ProfileV2Update) => {
    setSaving(true);
    setError(null);
    try {
      const fresh = await profileApi.update(patch);
      setData(fresh);
      return fresh;
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to save profile'));
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, loading, saving, error, reload, update };
}
