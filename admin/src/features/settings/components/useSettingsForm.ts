import { useEffect, useRef } from 'react';
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import type { SettingsKey, SettingsMap } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { useSaveSetting, useSetting } from '../hooks';

/** Props shared by every settings tab form. */
export interface SettingsFormProps {
  /** Lets the page guard navigation while there are unsaved edits. */
  onDirtyChange?: (dirty: boolean) => void;
}

export interface SettingsFormOptions<K extends SettingsKey, V extends FieldValues> extends SettingsFormProps {
  key: K;
  schema: z.ZodType<V, z.ZodTypeDef, unknown>;
  defaults: DefaultValues<V>;
  toForm: (data: SettingsMap[K]) => V;
  toPayload: (values: V) => SettingsMap[K];
}

/**
 * Load one settings key, keep a react-hook-form in sync with it and save it back.
 * - the form is (re)initialised from the query data with `reset`, unless the user is mid-edit;
 * - submit maps field errors via `applyServerErrors`, falls back to a toast, and resets to the saved value;
 * - Cmd/Ctrl+S submits when dirty.
 */
export function useSettingsForm<K extends SettingsKey, V extends FieldValues>(opts: SettingsFormOptions<K, V>) {
  const query = useSetting(opts.key);
  const save = useSaveSetting(opts.key, { silent: true });
  const form = useForm<V>({ resolver: zodResolver(opts.schema), defaultValues: opts.defaults });
  const { reset, setError, handleSubmit, formState } = form;
  // Read in render so the formState proxy subscribes to it.
  const dirty = formState.isDirty;

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const { data } = query;
  useEffect(() => {
    if (data === undefined) return;
    // A background refresh must not clobber in-progress edits; a save resets explicitly below.
    if (formState.isDirty) return;
    reset(optsRef.current.toForm(data));
  }, [data, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDirtyChange = opts.onDirtyChange;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => optsRef.current.onDirtyChange?.(false), []);

  const submit = handleSubmit(async (values) => {
    const payload = optsRef.current.toPayload(values);
    try {
      const saved = await save.mutateAsync(payload);
      reset(optsRef.current.toForm(saved ?? payload));
      toast.success('Сохранено');
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (!dirty) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty]);

  const cancel = () => {
    if (data !== undefined) reset(optsRef.current.toForm(data));
    else reset();
  };

  return { query, form, submit, cancel, dirty, saving: save.isPending };
}
