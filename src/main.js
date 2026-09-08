import "./index.css";

import { createClient } from "@supabase/supabase-js";

import { inject } from '@vercel/analytics';

inject();
/* --------------------------------
   SUPABASE
-------------------------------- */

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;


const supabase = createClient(
  supabaseUrl,
  supabaseKey
);


/* --------------------------------
   FORM
-------------------------------- */

const form =
  document.querySelector("#recur-form");

const submitButton =
  document.querySelector("#submit-button");

const message =
  document.querySelector("#form-message");


function showMessage(text, type = "") {

  message.textContent = text;

  message.className =
    `form-message ${type}`;

}


/* --------------------------------
   SUBMIT
-------------------------------- */

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const formData =
      new FormData(form);


    const name =
      formData.get("name")?.trim();

    const email =
      formData.get("email")
        ?.trim()
        .toLowerCase();

    const role =
      formData.get("role");


    const surveyData = {

  survey_version: 1,

  q1:
    formData.get("q1")?.trim() || null,

  q2:
    formData.get("q2")?.trim() || null,

  q3:
    formData.get("q3") || null,

  q4:
    formData.get("q4")?.trim() || null,

  q5:
    formData.get("q5")?.trim() || null,

  q6:
    formData.get("q6") || null,

  q7:
    formData.get("q7") || null

};


    submitButton.disabled = true;

    submitButton.innerHTML =
      "Joining...";

    showMessage("");


    try {

      /*
       * First add the person to the waitlist.
       */

      const {
        error: waitlistError
      } = await supabase
        .from("waitlist_signups")
        .insert({

          name,
          email,
          role,

          source:
            "landing_page"

        });


      /*
       * Existing email:
       * Don't treat it as a fatal error.
       *
       * We still try to save the research
       * response below.
       */

      if (
        waitlistError &&
        waitlistError.code !== "23505"
      ) {
        throw waitlistError;
      }


      /*
       * Save the research response.
       */

      const {
        error: surveyError
      } = await supabase
        .from("survey_responses")
        .insert(surveyData);


      if (surveyError) {
        throw surveyError;
      }


      /*
       * Success
       */

      form.reset();


      showMessage(
  "You're on the list. Thanks for helping us build Recur.",
  "success"
);

const shareUrl = window.location.href;

message.innerHTML = `
  <span class="success-main">
    You're on the list. Thanks for helping us build Recur.
  </span>

  <span class="share-prompt">
    Know a developer experiencing a bug?
    <strong>Send Recur to them.</strong>
  </span>

  <span class="share-actions">
    <button type="button" class="share-button" id="copy-link">
      Copy link
    </button>

    <button type="button" class="share-button share-primary" id="share-link">
      Share
    </button>
  </span>
`;

message.className = "form-message success referral";

const copyButton = document.querySelector("#copy-link");
const shareButton = document.querySelector("#share-link");

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);

    copyButton.textContent = "Copied";

    setTimeout(() => {
      copyButton.textContent = "Copy link";
    }, 2000);

  } catch (error) {
    console.error("Copy failed:", error);
  }
});

shareButton.addEventListener("click", async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Recur",
        text: "Know a developer who has spent way too long debugging a difficult bug? Check out Recur.",
        url: shareUrl
      });
    } catch (error) {
      // User cancelled the share sheet.
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);

    shareButton.textContent = "Link copied";

    setTimeout(() => {
      shareButton.textContent = "Share";
    }, 2000);
  }
});


   submitButton.innerHTML = "Thanks ✓";
submitButton.disabled = true;


    } catch (error) {

      console.error(
        "Submission error:",
        error
      );


      showMessage(
        "Something went wrong. Please try again.",
        "error"
      );


      submitButton.innerHTML =
        "Join the waitlist";


      submitButton.disabled = false;

    }

  }
);