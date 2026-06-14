"use client";

import { useCallback } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  collectInvalidFieldPaths,
  firstFormError,
  highlightInvalidFormFields,
} from "@/lib/feedback/form-errors";
import { parseApiError } from "@/lib/feedback/parse-api-error";
import { useToast } from "@/components/ui/toast-provider";

const REQUIRED_FALLBACK = "Veuillez compléter les champs obligatoires.";

export function useFormFeedback() {
  const { showError, showSuccess, showInfo } = useToast();

  const onFormInvalid = useCallback(
    (errors: FieldErrors, fallbackMessage = REQUIRED_FALLBACK) => {
      const message = firstFormError(errors) ?? fallbackMessage;
      const paths = collectInvalidFieldPaths(errors);
      highlightInvalidFormFields(paths);
      showError(message, paths.length ? "Champs obligatoires" : "Erreur");
    },
    [showError],
  );

  /** Compatible react-hook-form `handleSubmit(_, onInvalid)`. */
  const handleSubmitInvalid = useCallback(
    (errors: FieldErrors) => onFormInvalid(errors),
    [onFormInvalid],
  );

  const reportError = useCallback(
    (message: string, fieldPaths?: string[]) => {
      if (fieldPaths?.length) highlightInvalidFormFields(fieldPaths);
      showError(message);
    },
    [showError],
  );

  const reportApiError = useCallback(
    (body: unknown, fallback = "Une erreur est survenue") => {
      showError(parseApiError(body, fallback));
    },
    [showError],
  );

  const highlightFields = useCallback((fieldPaths: string[]) => {
    highlightInvalidFormFields(fieldPaths);
  }, []);

  return {
    showError,
    showSuccess,
    showInfo,
    handleSubmitInvalid,
    onFormInvalid,
    reportError,
    reportApiError,
    highlightFields,
  };
}
