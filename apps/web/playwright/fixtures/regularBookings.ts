import { expect, type Page } from "@playwright/test";

import dayjs from "@calcom/dayjs";
import { WEBAPP_URL } from "@calcom/lib/constants";
import type { MembershipRole } from "@calcom/prisma/enums";

import { localize } from "../lib/testUtils";
import type { createUsersFixture } from "./users";

const reschedulePlaceholderText = "Let others know why you need to reschedule";
export const scheduleSuccessfullyText = "This meeting is scheduled";

const EMAIL = "test@test.com";
const EMAIL2 = "test2@test.com";
const PHONE = "+55 (32) 983289947";

type BookingOptions = {
  hasPlaceholder?: boolean;
  isReschedule?: boolean;
  isRequired?: boolean;
  isAllRequired?: boolean;
  isMultiSelect?: boolean;
};

interface QuestionActions {
  [key: string]: () => Promise<void>;
}

type teamBookingtypes = { isManagedType?: boolean; isRoundRobinType?: boolean; isCollectiveType?: boolean };

type customLocators = {
  shouldChangeSelectLocator: boolean;
  shouldUseLastRadioGroupLocator: boolean;
  shouldUseFirstRadioGroupLocator: boolean;
  shouldChangeMultiSelectLocator: boolean;
};

type fillAndConfirmBookingParams = {
  eventTypePage: Page;
  placeholderText: string;
  question: string;
  fillText: string;
  secondQuestion: string;
  options: BookingOptions;
};

type UserFixture = ReturnType<typeof createUsersFixture>;

function isLastDayOfMonth(): boolean {
  const today = dayjs();
  const endOfMonth = today.endOf("month");
  return today.isSame(endOfMonth, "day");
}

const fillQuestion = async (eventTypePage: Page, questionType: string, customLocators: customLocators) => {
  const questionActions: QuestionActions = {
    phone: async () => {
      await eventTypePage.locator('input[name="phone-test"]').clear();
      await eventTypePage.locator('input[name="phone-test"]').fill(PHONE);
    },
    multiemail: async () => {
      await eventTypePage.getByRole("button", { name: `${questionType} test` }).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill(EMAIL);
      await eventTypePage.getByTestId("add-another-guest").last().click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).last().fill(EMAIL2);
    },
    checkbox: async () => {
      if (customLocators.shouldUseLastRadioGroupLocator || customLocators.shouldChangeMultiSelectLocator) {
        await eventTypePage.getByLabel("Option 1").last().click();
        await eventTypePage.getByLabel("Option 2").last().click();
      } else if (customLocators.shouldUseFirstRadioGroupLocator) {
        await eventTypePage.getByLabel("Option 1").first().click();
        await eventTypePage.getByLabel("Option 2").first().click();
      } else {
        await eventTypePage.getByLabel("Option 1").click();
        await eventTypePage.getByLabel("Option 2").click();
      }
    },
    multiselect: async () => {
      if (customLocators.shouldChangeMultiSelectLocator) {
        await eventTypePage.getByLabel("multi-select-dropdown").click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      } else {
        await eventTypePage.getByLabel("multi-select-dropdown").last().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      }
    },
    boolean: async () => {
      await eventTypePage.getByLabel(`${questionType} test`).check();
    },
    radio: async () => {
      await eventTypePage.locator('[id="radio-test\\.option\\.0\\.radio"]').click();
    },
    select: async () => {
      if (customLocators.shouldChangeSelectLocator) {
        await eventTypePage.getByLabel("select-dropdown").first().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      } else {
        await eventTypePage.getByLabel("select-dropdown").last().click();
        await eventTypePage.getByTestId("select-option-Option 1").click();
      }
    },
    number: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("123");
    },
    address: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("address test");
    },
    textarea: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("textarea test");
    },
    text: async () => {
      await eventTypePage.getByPlaceholder(`${questionType} test`).click();
      await eventTypePage.getByPlaceholder(`${questionType} test`).fill("text test");
    },
  };
  if (questionActions[questionType]) {
    await questionActions[questionType]();
  }
};

const fillAllQuestions = async (eventTypePage: Page, questions: string[], options: BookingOptions) => {
  if (options.isAllRequired) {
    for (const question of questions) {
      switch (question) {
        case "email":
          await eventTypePage.getByPlaceholder("Email").click();
          await eventTypePage.getByPlaceholder("Email").fill(EMAIL);
          break;
        case "phone":
          await eventTypePage.getByPlaceholder("Phone test").click();
          await eventTypePage.getByPlaceholder("Phone test").fill(PHONE);
          break;
        case "address":
          await eventTypePage.getByPlaceholder("Address test").click();
          await eventTypePage.getByPlaceholder("Address test").fill("123 Main St, City, Country");
          break;
        case "textarea":
          await eventTypePage.getByPlaceholder("Textarea test").click();
          await eventTypePage.getByPlaceholder("Textarea test").fill("This is a sample text for textarea.");
          break;
        case "select":
          await eventTypePage.getByLabel("select-dropdown").last().click();
          await eventTypePage.getByTestId("select-option-Option 1").click();
          break;
        case "multiselect":
          // select-dropdown
          await eventTypePage.getByLabel("multi-select-dropdown").click();
          await eventTypePage.getByTestId("select-option-Option 1").click();
          break;
        case "number":
          await eventTypePage.getByLabel("number test").click();
          await eventTypePage.getByLabel("number test").fill("123");
          break;
        case "radio":
          await eventTypePage.getByRole("radiogroup").getByText("Option 1").check();
          break;
        case "text":
          await eventTypePage.getByPlaceholder("Text test").click();
          await eventTypePage.getByPlaceholder("Text test").fill("Sample text");
          break;
        case "checkbox":
          await eventTypePage.getByLabel("Option 1").first().check();
          await eventTypePage.getByLabel("Option 2").first().check();
          break;
        case "boolean":
          await eventTypePage.getByLabel(`${question} test`).check();
          break;
        case "multiemail":
          await eventTypePage.getByRole("button", { name: "multiemail test" }).click();
          await eventTypePage.getByPlaceholder("multiemail test").fill(EMAIL);
          break;
      }
    }
  }
};

export async function loginUser(users: UserFixture) {
  const pro = await users.create({ name: "testuser" });
  await pro.apiLogin();
}

export async function loginUserWithTeam(users: UserFixture, role: MembershipRole) {
  const pro = await users.create(
    { name: "testuser" },
    { hasTeam: true, teamRole: role, isOrg: true, hasSubteam: true }
  );
  await pro.apiLogin();
}

const goToNextMonthIfNoAvailabilities = async (eventTypePage: Page) => {
  try {
    if (isLastDayOfMonth()) {
      await eventTypePage.getByTestId("view_next_month").waitFor({ timeout: 6000 });
      await eventTypePage.getByTestId("view_next_month").click();
    }
  } catch (err) {
    console.info("No need to click on view next month button");
  }
};

export function createBookingPageFixture(page: Page) {
  return {
    goToEventType: async (eventType: string) => {
      await page.getByRole("link", { name: eventType }).click();
    },
    goToPage: async (pageName: string, page: Page) => {
      await page.getByRole("link", { name: pageName }).click();
    },
    backToBookings: async (page: Page) => {
      await page.getByTestId("back-to-bookings").click();
    },
    goToTab: async (tabName: string) => {
      await page.getByTestId(`vertical-tab-${tabName}`).click();
    },

    goToEventTypesPage: async () => {
      await page.goto("/event-types");
    },

    setResolution: async (width: number, height: number) => {
      await page.setViewportSize({ width: width, height: height });
    },
    addQuestion: async (
      questionType: string,
      identifier: string,
      label: string,
      isRequired: boolean,
      placeholder?: string
    ) => {
      await page.getByTestId("add-field").click();
      await page.getByTestId("test-field-type").click();
      await page.getByTestId(`select-option-${questionType}`).click();
      await page.getByLabel("Identifier").dblclick();
      await page.getByLabel("Identifier").fill(identifier);
      await page.getByLabel("Label").click();
      await page.getByLabel("Label").fill(label);
      if (placeholder) {
        await page.getByLabel("Placeholder").click();
        await page.getByLabel("Placeholder").fill(placeholder);
      }
      if (!isRequired) {
        await page.getByRole("radio", { name: "No" }).click();
      }
      await page.getByTestId("field-add-save").click();
    },
    updateRecurringTab: async (repeatWeek: string, maxEvents: string) => {
      const repeatText = (await localize("en"))("repeats_every");
      const maximumOf = (await localize("en"))("for_a_maximum_of");
      await page.getByTestId("recurring-event-check").click();
      await page
        .getByTestId("recurring-event-collapsible")
        .locator("div")
        .filter({ hasText: repeatText })
        .getByRole("spinbutton")
        .fill(repeatWeek);
      await page
        .getByTestId("recurring-event-collapsible")
        .locator("div")
        .filter({ hasText: maximumOf })
        .getByRole("spinbutton")
        .fill(maxEvents);
    },
    updateEventType: async () => {
      await page.getByTestId("update-eventtype").click();
      const toast = await page.waitForSelector('[data-testid="toast-success"]');
      expect(toast).toBeTruthy();
    },

    previewEventType: async () => {
      const eventtypePromise = page.waitForEvent("popup");
      await page.getByTestId("preview-button").click();
      return eventtypePromise;
    },

    selectTimeSlot: async (eventTypePage: Page) => {
      await goToNextMonthIfNoAvailabilities(eventTypePage);
      await eventTypePage.getByTestId("time").first().click();
    },

    clickReschedule: async () => {
      await page.getByText("Reschedule").click();
    },

    selectFirstAvailableTime: async () => {
      await page.getByTestId("time").first().click();
    },

    fillRescheduleReasonAndConfirm: async () => {
      await page.getByPlaceholder(reschedulePlaceholderText).click();
      await page.getByPlaceholder(reschedulePlaceholderText).fill("Test reschedule");
      await page.getByTestId("confirm-reschedule-button").click();
    },

    fillRecurringFieldAndConfirm: async (eventTypePage: Page) => {
      await eventTypePage.getByTestId("occurrence-input").click();
      await eventTypePage.getByTestId("occurrence-input").fill("2");
      await goToNextMonthIfNoAvailabilities(eventTypePage);
      await eventTypePage.getByTestId("time").first().click();
      await expect(eventTypePage.getByTestId("recurring-dates")).toBeVisible();
    },

    cancelBookingWithReason: async (page: Page) => {
      await page.getByTestId("cancel").click();
      await page.getByTestId("cancel_reason").fill("Test cancel");
      await page.getByTestId("confirm_cancel").click();
    },

    assertBookingCanceled: async (page: Page) => {
      await expect(page.getByTestId("cancelled-headline")).toBeVisible();
    },

    rescheduleBooking: async (eventTypePage: Page) => {
      await goToNextMonthIfNoAvailabilities(eventTypePage);
      await eventTypePage.getByText("Reschedule").click();
      while (await eventTypePage.getByRole("button", { name: "View next" }).isVisible()) {
        await eventTypePage.getByRole("button", { name: "View next" }).click();
      }
      await eventTypePage.getByTestId("time").first().click();
      await eventTypePage.getByPlaceholder(reschedulePlaceholderText).click();
      await eventTypePage.getByPlaceholder(reschedulePlaceholderText).fill("Test reschedule");
      await eventTypePage.getByTestId("confirm-reschedule-button").click();
      await eventTypePage.waitForTimeout(400);
      if (
        await eventTypePage.getByRole("heading", { name: "Could not reschedule the meeting." }).isVisible()
      ) {
        await eventTypePage.getByTestId("back").click();
        await eventTypePage.getByTestId("time").last().click();
        await eventTypePage.getByTestId("confirm-reschedule-button").click();
      }
    },

    assertBookingRescheduled: async (page: Page) => {
      await expect(page.getByText(scheduleSuccessfullyText)).toBeVisible();
    },

    assertRepeatEventType: async () => {
      await expect(page.getByTestId("repeat-eventtype")).toBeVisible();
    },

    cancelBooking: async (eventTypePage: Page) => {
      await eventTypePage.getByTestId("cancel").click();
      await eventTypePage.getByTestId("cancel_reason").fill("Test cancel");
      await eventTypePage.getByTestId("confirm_cancel").click();
      await expect(eventTypePage.getByTestId("cancelled-headline")).toBeVisible();
    },

    confirmBooking: async (eventTypePage: Page) => {
      await eventTypePage.getByTestId("confirm-book-button").click();
      await eventTypePage.waitForURL("booking/**");
      await expect(eventTypePage.getByText(scheduleSuccessfullyText)).toBeVisible();
    },

    fillAndConfirmBooking: async ({
      eventTypePage,
      placeholderText,
      question,
      fillText,
      secondQuestion,
      options,
    }: fillAndConfirmBookingParams) => {
      const confirmButton = options.isReschedule ? "confirm-reschedule-button" : "confirm-book-button";

      await expect(eventTypePage.getByText(`${secondQuestion} test`).first()).toBeVisible();
      await eventTypePage.getByPlaceholder(placeholderText).fill(fillText);

      // Change the selector for specifics cases related to select question
      const shouldChangeSelectLocator = (question: string, secondQuestion: string): boolean =>
        question === "select" && ["multiemail", "multiselect", "address"].includes(secondQuestion);

      const shouldUseLastRadioGroupLocator = (question: string, secondQuestion: string): boolean =>
        question === "radio" && secondQuestion === "checkbox";

      const shouldUseFirstRadioGroupLocator = (question: string, secondQuestion: string): boolean =>
        question === "checkbox" && secondQuestion === "radio";

      const shouldChangeMultiSelectLocator = (question: string, secondQuestion: string): boolean =>
        question === "multiselect" &&
        ["address", "checkbox", "multiemail", "select"].includes(secondQuestion);

      const customLocators = {
        shouldChangeSelectLocator: shouldChangeSelectLocator(question, secondQuestion),
        shouldUseLastRadioGroupLocator: shouldUseLastRadioGroupLocator(question, secondQuestion),
        shouldUseFirstRadioGroupLocator: shouldUseFirstRadioGroupLocator(question, secondQuestion),
        shouldChangeMultiSelectLocator: shouldChangeMultiSelectLocator(question, secondQuestion),
      };

      // Fill the first question
      await fillQuestion(eventTypePage, question, customLocators);

      // Fill the second question if is required
      options.isRequired && (await fillQuestion(eventTypePage, secondQuestion, customLocators));

      await eventTypePage.getByTestId(confirmButton).click();
      await eventTypePage.waitForTimeout(400);
      if (await eventTypePage.getByRole("heading", { name: "Could not book the meeting." }).isVisible()) {
        await eventTypePage.getByTestId("back").click();
        await eventTypePage.getByTestId("time").last().click();
        await fillQuestion(eventTypePage, question, customLocators);
        options.isRequired && (await fillQuestion(eventTypePage, secondQuestion, customLocators));
        await eventTypePage.getByTestId(confirmButton).click();
      }
      const scheduleSuccessfullyPage = eventTypePage.getByText(scheduleSuccessfullyText);
      await scheduleSuccessfullyPage.waitFor({ state: "visible" });
      await expect(scheduleSuccessfullyPage).toBeVisible();
    },

    fillAllQuestions: async (eventTypePage: Page, questions: string[], options: BookingOptions) => {
      const confirmButton = options.isReschedule ? "confirm-reschedule-button" : "confirm-book-button";
      await fillAllQuestions(eventTypePage, questions, options);
      await eventTypePage.getByTestId(confirmButton).click();
      const scheduleSuccessfullyPage = eventTypePage.getByText(scheduleSuccessfullyText);
      await scheduleSuccessfullyPage.waitFor({ state: "visible" });
      await expect(scheduleSuccessfullyPage).toBeVisible();
    },
    addGuests: async (eventTypePage: Page, options: { guests: string[] }) => {
      await eventTypePage.getByTestId("add-guests").click();
      for (const guest of options.guests) {
        await eventTypePage.getByPlaceholder("Email").fill(guest);
      }
    },
    createTeam: async (name: string) => {
      await page.getByTestId("teams-test").click();
      await page.getByTestId("new-team-btn").click();
      await page.getByPlaceholder("Acme Inc.").click();
      await page.getByPlaceholder("Acme Inc.").fill(name);
      await page.getByTestId("continue-button").click();
      await page.getByTestId("publish-button").click();

      await page.getByTestId("vertical-tab-Back").click();
    },

    createTeamEventType: async (name: string, options: teamBookingtypes) => {
      await page.getByTestId("new-event-type").click();
      await page.getByTestId("option-0").click();

      // We first simulate to create a default event type to check if managed option is not available

      const managedEventDescription = (await localize("en"))("managed_event_description");
      const roundRobinEventDescription = (await localize("en"))("round_robin_description");
      const collectiveEventDescription = (await localize("en"))("collective_description");
      const quickChatText = (await localize("en"))("quick_chat");
      await expect(page.locator("div").filter({ hasText: managedEventDescription })).toBeHidden();
      await page.getByTestId("dialog-rejection").click();

      await page.getByTestId("new-event-type").click();
      await page.getByTestId("option-team-1").click();
      await page.getByPlaceholder(quickChatText).fill(name);
      if (options.isCollectiveType) {
        await page
          .locator("div")
          .filter({ hasText: `Collective${collectiveEventDescription}` })
          .getByRole("radio")
          .first()
          .click();
      }

      if (options.isRoundRobinType) {
        await page
          .locator("div")
          .filter({ hasText: `Round Robin${roundRobinEventDescription}` })
          .getByRole("radio")
          .nth(1)
          .click();
      }

      if (options.isManagedType) {
        await page
          .locator("div")
          .filter({ hasText: `Managed Event${managedEventDescription}` })
          .getByRole("radio")
          .last()
          .click();

        const managedEventClarification = (await localize("en"))("managed_event_url_clarification");
        await expect(page.getByText(managedEventClarification)).toBeVisible();
      }

      const continueText = (await localize("en"))("continue");
      const toast = page.getByTestId("toast-success");

      await page.getByRole("button", { name: continueText }).click();
      expect(toast).toBeTruthy();
      await page.getByTestId("update-eventtype").click();
    },
    assertLabelWithCorrectTeamName: async (page: Page, teamName: string) => {
      await expect(page.getByRole("link", { name: teamName }).first()).toBeVisible();
    },
    assertBookingWithCorrectTitleAndDescription: async (
      page: Page,
      options: { profileName: string; bookingName: string; teamName: string; aditionalGuestEmail?: string }
    ) => {
      options.aditionalGuestEmail
        ? await expect(
            page.getByRole("link", {
              name: `${options.bookingName} between ${options.teamName} and ${options.profileName} You , ${options.profileName} and ${options.aditionalGuestEmail}`,
            })
          ).toBeVisible()
        : await expect(
            page.getByRole("link", {
              name: `${options.bookingName} between ${options.teamName} and ${options.profileName} You and ${options.profileName}`,
            })
          ).toBeVisible();
    },
    clickOnBooking: async (page: Page, teamName: string) => {
      await page.getByRole("link", { name: teamName }).first().click();
    },

    checkField: async (question: string, options?: { isOptional: boolean }) => {
      if (options?.isOptional) {
        await expect(page.getByTestId(`field-${question}-test`).getByTestId("optional")).toBeVisible();
      } else {
        await expect(page.getByTestId(`field-${question}-test`).getByTestId("required")).toBeVisible();
      }
      await expect(page.getByTestId(`field-${question}-test`)).toBeVisible();
    },

    checkRequiresConfirmation: async () => {
      // Check existence of the icon
      await expect(page.getByTestId("requires-confirmation-title").locator("svg")).toBeVisible();

      const confirmationSwitch = page.getByTestId("requires-confirmation");
      await expect(confirmationSwitch).toBeVisible();
      await confirmationSwitch.click();
    },

    checkRequiresBookerEmailVerification: async () => {
      await expect(page.getByTestId("requires-booker-email-verification-title").locator("svg")).toBeVisible();

      const emailSwitch = page.getByTestId("requires-booker-email-verification");

      await expect(emailSwitch).toBeVisible();
      await emailSwitch.click();
    },

    checkHideNotes: async () => {
      await expect(page.getByTestId("disable-notes-title").locator("svg")).toBeVisible();

      const hideNotesSwitch = page.getByTestId("disable-notes");

      await expect(hideNotesSwitch).toBeVisible();
      await hideNotesSwitch.click();
    },

    checkRedirectOnBooking: async () => {
      await expect(page.getByTestId("redirect-success-booking-title").locator("svg")).toBeVisible();

      const redirectSwitch = page.getByTestId("redirect-success-booking");
      await expect(redirectSwitch).toBeVisible();
      await redirectSwitch.click();
      await expect(page.getByTestId("external-redirect-url")).toBeVisible();
      await page.getByTestId("external-redirect-url").fill("https://cal.com");
      await expect(page.getByTestId("redirect-url-warning")).toBeVisible();
    },

    checkEnablePrivateUrl: async () => {
      await expect(page.getByTestId("hashedLinkCheck-title").locator("label div")).toBeVisible();

      await expect(page.getByTestId("hashedLinkCheck-info")).toBeVisible();
      await expect(page.getByTestId("hashedLinkCheck")).toBeVisible();
      await page.getByTestId("hashedLinkCheck").click();
      await expect(page.getByTestId("generated-hash-url")).toBeVisible();
    },

    toggleOfferSeats: async () => {
      await expect(page.getByTestId("offer-seats-toggle-title").locator("svg")).toBeVisible();

      await page.getByTestId("offer-seats-toggle").click();

      const seatSwitchField = page.getByTestId("seats-per-time-slot");
      await seatSwitchField.fill("3");
      await expect(seatSwitchField).toHaveValue("3");
      await expect(page.getByTestId("show-attendees")).toBeVisible();
    },

    checkLockTimezone: async () => {
      await expect(page.getByTestId("lock-timezone-toggle-title").locator("svg")).toBeVisible();

      const lockSwitch = page.getByTestId("lock-timezone-toggle");

      await expect(lockSwitch).toBeVisible();
      await lockSwitch.click();
    },

    checkEventType: async () => {
      await expect(page.getByTestId("requires-confirmation-badge").last()).toBeVisible();
    },

    assertBookingIsVisible: async (name: string) => {
      await expect(
        page.getByRole("link", {
          name,
        })
      ).toBeVisible();
    },
    checkBufferTime: async () => {
      const minutes = (await localize("en"))("minutes");
      const fieldPlaceholder = page.getByPlaceholder("0");

      await page
        .locator("div")
        .filter({ hasText: /^No buffer time$/ })
        .nth(1)
        .click();
      await page.getByTestId("select-option-15").click();
      await expect(page.getByText(`15 ${minutes}`, { exact: true })).toBeVisible();

      await page
        .locator("div")
        .filter({ hasText: /^No buffer time$/ })
        .nth(2)
        .click();
      await page.getByTestId("select-option-10").click();
      await expect(page.getByText(`10 ${minutes}`, { exact: true })).toBeVisible();

      await fieldPlaceholder.fill("10");
      await expect(fieldPlaceholder).toHaveValue("10");

      await page
        .locator("div")
        .filter({ hasText: /^Use event length \(default\)$/ })
        .first()
        .click();

      // select a large interval to check if the time slots for a day reduce on the preview page
      await page.getByTestId("select-option-60").click();
      await expect(page.getByText(`60 ${minutes}`, { exact: true })).toBeVisible();
    },

    checkLimitBookingFrequency: async () => {
      const fieldPlaceholder = page.getByPlaceholder("1").nth(1);
      const limitFrequency = (await localize("en"))("limit_booking_frequency");
      const addlimit = (await localize("en"))("add_limit");
      const limitFrequencySwitch = page
        .locator("fieldset")
        .filter({ hasText: limitFrequency })
        .getByRole("switch");

      await limitFrequencySwitch.click();
      await page.getByRole("button", { name: addlimit }).click();
      await fieldPlaceholder.fill("12");
      await expect(fieldPlaceholder).toHaveValue("12");
      await limitFrequencySwitch.click();
    },

    checkLimitBookingDuration: async () => {
      const limitDuration = (await localize("en"))("limit_total_booking_duration");
      const addlimit = (await localize("en"))("add_limit");
      const limitDurationSwitch = page
        .locator("fieldset")
        .filter({ hasText: limitDuration })
        .getByRole("switch");

      await limitDurationSwitch.click();
      await page.getByRole("button", { name: addlimit }).click();
      await expect(page.getByTestId("add-limit")).toHaveCount(2);
      await limitDurationSwitch.click();
    },

    checkLimitFutureBookings: async () => {
      const limitFutureBookings = (await localize("en"))("limit_future_bookings");
      const limitBookingsSwitch = page
        .locator("fieldset")
        .filter({ hasText: limitFutureBookings })
        .getByRole("switch");

      await limitBookingsSwitch.click();
      await page.locator("#RANGE").click();
      await expect(page.locator("#RANGE")).toBeChecked();
      await limitBookingsSwitch.click();
    },

    checkOffsetTimes: async () => {
      const offsetStart = (await localize("en"))("offset_start");
      const offsetStartTimes = (await localize("en"))("offset_toggle");
      const offsetLabel = page.getByLabel(offsetStart);

      await page.locator("fieldset").filter({ hasText: offsetStartTimes }).getByRole("switch").click();
      await offsetLabel.fill("10");
      await expect(offsetLabel).toHaveValue("10");
      await expect(
        page.getByText("e.g. this will show time slots to your bookers at 9:10 AM instead of 9:00 AM")
      ).toBeVisible();
    },

    checkTimeSlotsCount: async (eventTypePage: Page, count: number) => {
      await expect(eventTypePage.getByTestId("time")).toHaveCount(count);
    },
    createBookingWebhook: async (webhookReceiver: { url: string }, eventTitle: string) => {
      const events = [
        "Booking Canceled",
        "Booking Created",
        "Booking Rejected",
        "Booking Requested",
        "Booking Payment Initiated",
        "Booking Rescheduled",
        "Meeting Ended",
        "Booking Paid",
        "Recording Download Link Ready",
      ];
      await page.goto(`${WEBAPP_URL}/event-types`);
      await page.getByText(eventTitle).click();

      await page.getByTestId("vertical-tab-webhooks").click();

      await page.getByTestId("new_webhook").click();
      await page.getByLabel("Subscriber URL").fill(webhookReceiver.url);
      await page.getByRole("button", { name: "Ping test" }).click();
      page
        .getByTestId("dialog-creation")
        .locator("div")
        .filter({ hasText: '{ "ok": true, "status": 200, "message": "{}" }' })
        .nth(2);
      await page.getByRole("button", { name: "Create Webhook" }).click();

      page.getByText(webhookReceiver.url);
      events.forEach((event) => {
        page.getByText(event);
      });
    },
    rejectFirstBooking: async () => {
      await page.goto("/bookings/unconfirmed");
      await page.getByTestId("horizontal-tab-unconfirmed").click();
      await page.getByTestId("booking-item").first().getByText("Reject").click();
      await page.getByTestId("rejection-confirm").click();
    },
    fillEmailAndName: async (eventTypePage: Page) => {
      const emailLabel = (await localize("en"))("email_address");
      const nameLabel = (await localize("en"))("your_name");

      await eventTypePage.getByLabel(emailLabel).fill(EMAIL);
      await eventTypePage.getByLabel(nameLabel).fill("testuser");
    },
  };
}
