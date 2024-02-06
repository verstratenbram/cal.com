import dynamic from "next/dynamic";
import Link from "next/link";
import type { EventTypeSetupProps, FormValues } from "pages/event-types/[type]";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import short from "short-uuid";
import { v5 as uuidv5 } from "uuid";
import type { z } from "zod";

import type { EventNameObjectType } from "@calcom/core/event";
import { getEventName } from "@calcom/core/event";
import getLocationsOptionsForSelect from "@calcom/features/bookings/lib/getLocationOptionsForSelect";
import DestinationCalendarSelector from "@calcom/features/calendars/DestinationCalendarSelector";
import useLockedFieldsManager from "@calcom/features/ee/managed-event-types/hooks/useLockedFieldsManager";
import {
  allowDisablingAttendeeConfirmationEmails,
  allowDisablingHostConfirmationEmails,
} from "@calcom/features/ee/workflows/lib/allowDisablingStandardEmails";
import { FormBuilder } from "@calcom/features/form-builder/FormBuilder";
import type { EditableSchema } from "@calcom/features/form-builder/schema";
import { BookerLayoutSelector } from "@calcom/features/settings/BookerLayoutSelector";
import { classNames } from "@calcom/lib";
import { APP_NAME, CAL_URL } from "@calcom/lib/constants";
import { IS_VISUAL_REGRESSION_TESTING } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { Prisma } from "@calcom/prisma/client";
import { trpc } from "@calcom/trpc/react";
import {
  Alert,
  Button,
  CheckboxField,
  Label,
  SettingsToggle,
  showToast,
  TextField,
  Tooltip,
} from "@calcom/ui";
import { Copy, Edit, Info } from "@calcom/ui/components/icon";

import RequiresConfirmationController from "./RequiresConfirmationController";

const CustomEventTypeModal = dynamic(() => import("@components/eventtype/CustomEventTypeModal"));

const generateHashedLink = (id: number) => {
  const translator = short();
  const seed = `${id}:${new Date().getTime()}`;
  const uid = translator.fromUUID(uuidv5(seed, uuidv5.URL));
  return uid;
};

export const EventAdvancedTab = ({ eventType, team }: Pick<EventTypeSetupProps, "eventType" | "team">) => {
  const connectedCalendarsQuery = trpc.viewer.connectedCalendars.useQuery();
  const { data: user } = trpc.viewer.me.useQuery();
  const formMethods = useFormContext<FormValues>();
  const { t } = useLocale();

  const [showEventNameTip, setShowEventNameTip] = useState(false);
  const [hashedLinkVisible, setHashedLinkVisible] = useState(!!formMethods.getValues("hashedLink"));
  const [redirectUrlVisible, setRedirectUrlVisible] = useState(!!formMethods.getValues("successRedirectUrl"));
  const [hashedUrl, setHashedUrl] = useState(eventType.hashedLink?.link);

  const bookingFields: Prisma.JsonObject = {};

  const workflows = eventType.workflows.map((workflowOnEventType) => workflowOnEventType.workflow);
  const selectedThemeIsDark =
    user?.theme === "dark" ||
    (!user?.theme && typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  formMethods.getValues().bookingFields.forEach(({ name }) => {
    bookingFields[name] = `${name} input`;
  });

  const eventNameObject: EventNameObjectType = {
    attendeeName: t("scheduler"),
    eventType: formMethods.getValues("title"),
    eventName: formMethods.getValues("eventName"),
    host: formMethods.getValues("users")[0]?.name || "Nameless",
    bookingFields: bookingFields,
    t,
  };

  const [requiresConfirmation, setRequiresConfirmation] = useState(
    formMethods.getValues("requiresConfirmation")
  );
  const placeholderHashedLink = `${CAL_URL}/d/${hashedUrl}/${formMethods.getValues("slug")}`;
  const seatsEnabled = formMethods.watch("seatsPerTimeSlotEnabled");
  const noShowFeeEnabled =
    formMethods.getValues("metadata")?.apps?.stripe?.enabled === true &&
    formMethods.getValues("metadata")?.apps?.stripe?.paymentOption === "HOLD";

  useEffect(() => {
    !hashedUrl && setHashedUrl(generateHashedLink(formMethods.getValues("users")[0]?.id ?? team?.id));
  }, [formMethods.getValues("users"), hashedUrl, team?.id]);

  const toggleGuests = (enabled: boolean) => {
    const bookingFields = formMethods.getValues("bookingFields");
    formMethods.setValue(
      "bookingFields",
      bookingFields.map((field) => {
        if (field.name === "guests") {
          return {
            ...field,
            hidden: !enabled,
            editable: (!enabled ? "system-but-hidden" : "system-but-optional") as z.infer<
              typeof EditableSchema
            >,
          };
        }
        return field;
      })
    );
  };

  const { shouldLockDisableProps } = useLockedFieldsManager(
    formMethods.getValues(),
    t("locked_fields_admin_description"),
    t("locked_fields_member_description")
  );
  const eventNamePlaceholder = getEventName({
    ...eventNameObject,
    eventName: formMethods.watch("eventName"),
  });

  const successRedirectUrlLocked = shouldLockDisableProps("successRedirectUrl");
  const seatsLocked = shouldLockDisableProps("seatsPerTimeSlotEnabled");

  const closeEventNameTip = () => setShowEventNameTip(false);

  return (
    <div className="flex flex-col space-y-4">
      {/**
       * Only display calendar selector if user has connected calendars AND if it's not
       * a team event. Since we don't have logic to handle each attendee calendar (for now).
       * This will fallback to each user selected destination calendar.
       */}
      <div className="border-subtle space-y-6 rounded-lg border p-6">
        {!!connectedCalendarsQuery.data?.connectedCalendars.length && !team && (
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div>
                <Label className="text-emphasis mb-0 font-medium">{t("add_to_calendar")}</Label>
              </div>
              <Link
                href="/apps/categories/calendar"
                target="_blank"
                className="hover:text-emphasis text-default text-sm">
                {t("add_another_calendar")}
              </Link>
            </div>
            <Controller
              name="destinationCalendar"
              render={({ field: { onChange, value } }) => (
                <DestinationCalendarSelector
                  value={value ? value.externalId : undefined}
                  onChange={onChange}
                  hidePlaceholder
                  hideAdvancedText
                />
              )}
            />
            <p className="text-subtle text-sm">{t("select_which_cal")}</p>
          </div>
        )}
        <div className="w-full">
          <TextField
            label={t("event_name_in_calendar")}
            type="text"
            {...shouldLockDisableProps("eventName")}
            placeholder={eventNamePlaceholder}
            {...formMethods.register("eventName")}
            addOnSuffix={
              <Button
                color="minimal"
                size="sm"
                aria-label="edit custom name"
                className="hover:stroke-3 hover:text-emphasis min-w-fit !py-0 px-0 hover:bg-transparent"
                onClick={() => setShowEventNameTip((old) => !old)}>
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      <BookerLayoutSelector fallbackToUserSettings isDark={selectedThemeIsDark} isOuterBorder={true} />

      <div className="border-subtle space-y-6 rounded-lg border p-6">
        <FormBuilder
          title={t("booking_questions_title")}
          description={t("booking_questions_description")}
          addFieldLabel={t("add_a_booking_question")}
          formProp="bookingFields"
          {...shouldLockDisableProps("bookingFields")}
          dataStore={{
            options: {
              locations: getLocationsOptionsForSelect(formMethods.getValues("locations") ?? [], t),
            },
          }}
        />
      </div>

      <RequiresConfirmationController
        eventType={eventType}
        seatsEnabled={seatsEnabled}
        metadata={formMethods.getValues("metadata")}
        requiresConfirmation={requiresConfirmation}
        onRequiresConfirmation={setRequiresConfirmation}
      />

      <Controller
        name="requiresBookerEmailVerification"
        render={({ field: { value, onChange } }) => (
          <SettingsToggle
            labelClassName="text-sm"
            toggleSwitchAtTheEnd={true}
            switchContainerClassName="border-subtle rounded-lg border py-6 px-4 sm:px-6"
            title={t("requires_booker_email_verification")}
            data-testid="requires-booker-email-verification"
            {...shouldLockDisableProps("requiresBookerEmailVerification")}
            description={t("description_requires_booker_email_verification")}
            checked={value}
            onCheckedChange={(e) => onChange(e)}
          />
        )}
      />

      <Controller
        name="hideCalendarNotes"
        render={({ field: { value, onChange } }) => (
          <SettingsToggle
            labelClassName="text-sm"
            toggleSwitchAtTheEnd={true}
            switchContainerClassName="border-subtle rounded-lg border py-6 px-4 sm:px-6"
            title={t("disable_notes")}
            data-testid="disable-notes"
            {...shouldLockDisableProps("hideCalendarNotes")}
            description={t("disable_notes_description")}
            checked={value}
            onCheckedChange={(e) => onChange(e)}
          />
        )}
      />

      <Controller
        name="successRedirectUrl"
        render={({ field: { value, onChange } }) => (
          <>
            <SettingsToggle
              labelClassName="text-sm"
              toggleSwitchAtTheEnd={true}
              switchContainerClassName={classNames(
                "border-subtle rounded-lg border py-6 px-4 sm:px-6",
                redirectUrlVisible && "rounded-b-none"
              )}
              childrenClassName="lg:ml-0"
              title={t("redirect_success_booking")}
              data-testid="redirect-success-booking"
              {...successRedirectUrlLocked}
              description={t("redirect_url_description")}
              checked={redirectUrlVisible}
              onCheckedChange={(e) => {
                setRedirectUrlVisible(e);
                onChange(e ? value : "");
              }}>
              <div className="border-subtle rounded-b-lg border border-t-0 p-6">
                <TextField
                  className="w-full"
                  label={t("redirect_success_booking")}
                  labelSrOnly
                  disabled={successRedirectUrlLocked.disabled}
                  placeholder={t("external_redirect_url")}
                  data-testid="external-redirect-url"
                  required={redirectUrlVisible}
                  type="text"
                  {...formMethods.register("successRedirectUrl")}
                />
                <div
                  className={classNames(
                    "p-1 text-sm text-orange-600",
                    formMethods.getValues("successRedirectUrl") ? "block" : "hidden"
                  )}
                  data-testid="redirect-url-warning">
                  {t("redirect_url_warning")}
                </div>
              </div>
            </SettingsToggle>
          </>
        )}
      />

      <SettingsToggle
        labelClassName="text-sm"
        toggleSwitchAtTheEnd={true}
        switchContainerClassName={classNames(
          "border-subtle rounded-lg border py-6 px-4 sm:px-6",
          hashedLinkVisible && "rounded-b-none"
        )}
        childrenClassName="lg:ml-0"
        data-testid="hashedLinkCheck"
        title={t("enable_private_url")}
        Badge={
          <a
            data-testid="hashedLinkCheck-info"
            target="_blank"
            rel="noreferrer"
            href="https://cal.com/docs/core-features/event-types/single-use-private-links">
            <Info className="ml-1.5 h-4 w-4 cursor-pointer" />
          </a>
        }
        {...shouldLockDisableProps("hashedLinkCheck")}
        description={t("private_link_description", { appName: APP_NAME })}
        checked={hashedLinkVisible}
        onCheckedChange={(e) => {
          formMethods.setValue("hashedLink", e ? hashedUrl : undefined);
          setHashedLinkVisible(e);
        }}>
        <div className="border-subtle rounded-b-lg border border-t-0 p-6">
          {!IS_VISUAL_REGRESSION_TESTING && (
            <TextField
              disabled
              name="hashedLink"
              label={t("private_link_label")}
              data-testid="generated-hash-url"
              labelSrOnly
              type="text"
              hint={t("private_link_hint")}
              defaultValue={placeholderHashedLink}
              addOnSuffix={
                <Tooltip
                  content={
                    formMethods.getValues("hashedLink") ? t("copy_to_clipboard") : t("enabled_after_update")
                  }>
                  <Button
                    color="minimal"
                    size="sm"
                    type="button"
                    className="hover:stroke-3 hover:text-emphasis min-w-fit !py-0 px-0 hover:bg-transparent"
                    aria-label="copy link"
                    onClick={() => {
                      navigator.clipboard.writeText(placeholderHashedLink);
                      if (formMethods.getValues("hashedLink")) {
                        showToast(t("private_link_copied"), "success");
                      } else {
                        showToast(t("enabled_after_update_description"), "warning");
                      }
                    }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tooltip>
              }
            />
          )}
        </div>
      </SettingsToggle>

      <Controller
        name="seatsPerTimeSlotEnabled"
        render={({ field: { value, onChange } }) => (
          <>
            <SettingsToggle
              labelClassName="text-sm"
              toggleSwitchAtTheEnd={true}
              switchContainerClassName={classNames(
                "border-subtle rounded-lg border py-6 px-4 sm:px-6",
                value && "rounded-b-none"
              )}
              childrenClassName="lg:ml-0"
              data-testid="offer-seats-toggle"
              title={t("offer_seats")}
              {...seatsLocked}
              description={t("offer_seats_description")}
              checked={value}
              disabled={noShowFeeEnabled}
              onCheckedChange={(e) => {
                // Enabling seats will disable guests and requiring confirmation until fully supported
                if (e) {
                  toggleGuests(false);
                  formMethods.setValue("requiresConfirmation", false);
                  setRequiresConfirmation(false);
                  formMethods.setValue("metadata.multipleDuration", undefined);
                  formMethods.setValue("seatsPerTimeSlot", eventType.seatsPerTimeSlot ?? 2);
                } else {
                  formMethods.setValue("seatsPerTimeSlot", null);
                  toggleGuests(true);
                }
                onChange(e);
              }}>
              <div className="border-subtle rounded-b-lg border border-t-0 p-6">
                <Controller
                  name="seatsPerTimeSlot"
                  render={({ field: { value, onChange } }) => (
                    <div>
                      <TextField
                        required
                        name="seatsPerTimeSlot"
                        labelSrOnly
                        label={t("number_of_seats")}
                        type="number"
                        disabled={seatsLocked.disabled}
                        defaultValue={value}
                        min={1}
                        containerClassName="max-w-80"
                        addOnSuffix={<>{t("seats")}</>}
                        onChange={(e) => {
                          onChange(Math.abs(Number(e.target.value)));
                        }}
                        data-testid="seats-per-time-slot"
                      />
                      <div className="mt-4">
                        <Controller
                          name="seatsShowAttendees"
                          render={({ field: { value, onChange } }) => (
                            <CheckboxField
                              data-testid="show-attendees"
                              description={t("show_attendees")}
                              disabled={seatsLocked.disabled}
                              onChange={(e) => onChange(e)}
                              checked={value}
                            />
                          )}
                        />
                      </div>
                      <div className="mt-2">
                        <Controller
                          name="seatsShowAvailabilityCount"
                          render={({ field: { value, onChange } }) => (
                            <CheckboxField
                              description={t("show_available_seats_count")}
                              disabled={seatsLocked.disabled}
                              onChange={(e) => onChange(e)}
                              checked={value}
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </SettingsToggle>
            {noShowFeeEnabled && <Alert severity="warning" title={t("seats_and_no_show_fee_error")} />}
          </>
        )}
      />
      <Controller
        name="lockTimeZoneToggleOnBookingPage"
        render={({ field: { value, onChange } }) => (
          <SettingsToggle
            labelClassName="text-sm"
            toggleSwitchAtTheEnd={true}
            switchContainerClassName="border-subtle rounded-lg border py-6 px-4 sm:px-6"
            title={t("lock_timezone_toggle_on_booking_page")}
            {...shouldLockDisableProps("lockTimeZoneToggleOnBookingPage")}
            description={t("description_lock_timezone_toggle_on_booking_page")}
            checked={value}
            onCheckedChange={(e) => onChange(e)}
            data-testid="lock-timezone-toggle"
          />
        )}
      />
      {allowDisablingAttendeeConfirmationEmails(workflows) && (
        <Controller
          name="metadata.disableStandardEmails.confirmation.attendee"
          render={({ field: { value, onChange } }) => (
            <>
              <SettingsToggle
                labelClassName="text-sm"
                toggleSwitchAtTheEnd={true}
                switchContainerClassName="border-subtle rounded-lg border py-6 px-4 sm:px-6"
                title={t("disable_attendees_confirmation_emails")}
                description={t("disable_attendees_confirmation_emails_description")}
                checked={value}
                onCheckedChange={(e) => onChange(e)}
              />
            </>
          )}
        />
      )}
      {allowDisablingHostConfirmationEmails(workflows) && (
        <Controller
          name="metadata.disableStandardEmails.confirmation.host"
          defaultValue={!!formMethods.getValues("seatsPerTimeSlot")}
          render={({ field: { value, onChange } }) => (
            <>
              <SettingsToggle
                labelClassName="text-sm"
                toggleSwitchAtTheEnd={true}
                switchContainerClassName="border-subtle rounded-lg border py-6 px-4 sm:px-6"
                title={t("disable_host_confirmation_emails")}
                description={t("disable_host_confirmation_emails_description")}
                checked={value}
                onCheckedChange={(e) => onChange(e)}
              />
            </>
          )}
        />
      )}
      {showEventNameTip && (
        <CustomEventTypeModal
          close={closeEventNameTip}
          setValue={(val: string) => formMethods.setValue("eventName", val)}
          defaultValue={formMethods.getValues("eventName")}
          placeHolder={eventNamePlaceholder}
          event={eventNameObject}
        />
      )}
    </div>
  );
};
