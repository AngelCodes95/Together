import { useState } from "react";
import { useFormContext } from "../../contexts/FormContext";
import { parseISO, sub, isAfter, isSameDay } from "date-fns";

const FormMoverControl = () => {
  const {
    formData,
    currentStep,
    totalSteps,
    handleNewStep,
    setFormCreateEventErrors,
    setFormScheduleEventErrors,
  } = useFormContext();

  const [errorArray, setErrorArray] = useState([]);

  function checkForEmptyField(input) {
    let fieldName = `${input}`;
    let otherNameIGuess = "";

    // if page 2
    if (currentStep === 2) {
      // Take the last four letters of input, call that the second word
      otherNameIGuess += fieldName.slice(
        fieldName.length - 4,
        fieldName.length
      );
      // the first word is either start or end, just see if the word includes it
      if (fieldName.includes("start") || fieldName.includes("initial")) {
        otherNameIGuess = "Start " + otherNameIGuess;
      } else {
        otherNameIGuess = "End " + otherNameIGuess;
      }
    }
    // else, just set $input
    else {
      otherNameIGuess = fieldName;
    }
    if (formData[input] === "" || !formData[input]) {
      errorArray.push("Error: " + otherNameIGuess + " field can't be empty");
    }
  }

  const handleNextButton = () => {
    // Run a bunch of tests for each form page.
    // For each test that returns an error, save a value.
    // Return the values to the form page"s component.

    setErrorArray([]);

    switch (currentStep) {
      case 1:
        // Check if any values are empty string, null, undefined, and/or less than 2 characters
        // Side note: This is the only case where you"d ever want to use == instead of ===

        checkForEmptyField("title");
        checkForEmptyField("description");
        if (formData.description?.length > 280) {
          errorArray.push(
            `Error: Description must be less than 280 characters. Current character count: ${formData.description?.length}.`
          );
        }
        checkForEmptyField("location");

        setFormCreateEventErrors(errorArray);
        break;

      // 2nd page - FormScheduleEvent
      case 2: {
        // Empty Field Value Tests
        checkForEmptyField("initialDate");
        checkForEmptyField("finalDate");
        checkForEmptyField("startTime");
        checkForEmptyField("endTime");

        // Start Date & End Date Cannot be more than 90 days apart
        // get date 90 days before final date
        const NinetyDaysBeforeFinalDate = sub(parseISO(formData["finalDate"]), {
          days: 90,
        });
        if (parseISO(formData["initialDate"]) < NinetyDaysBeforeFinalDate) {
          errorArray.push(
            "Error: Start date and End date cannot be more than 90 days apart"
          );
        }

        // "Weekly" Recurring Event MUST include at least on day of week
        if (
          formData["recurring"]["rate"] === "weekly" &&
          formData["recurring"]["days"].length === 0
        ) {
          errorArray.push(
            "Error: Weekly recurring event MUST include at least one day of the week"
          );
        }

        // initialDate should be the same as or before the finalDate
        const initialDate = new Date(
          `${formData.initialDate}T${formData.startTime}:00`
        );
        const finalDate = new Date(
          `${formData.finalDate}T${formData.endTime}:00`
        );
        const currentDate = new Date();
        if (isAfter(initialDate, finalDate)) {
          errorArray.push("Error: End date/time is before Start date/time");
        }

        // Validate if not reoccuring is checked that user must have same initial and final date
        if (
          formData["recurring"]["rate"] === "noRecurr" &&
          !isSameDay(initialDate, finalDate)
        ) {
          errorArray.push(
            "Error: If event is not reoccuring start date and end date must be the same day"
          );
        }

        // Validate that start date and time is after the current time
        if (isAfter(currentDate, initialDate)) {
          errorArray.push(
            "Error: start date/time must be after the current time"
          );
        }

        setFormScheduleEventErrors(errorArray);
        break;
      }
      default:
        break;
    }
    // Only if none of the tests return an error do we allow currentStep to iterate
    // By running handleNextStep.

    if (errorArray.length <= 0) {
      handleNewStep("next");
    }
  };

  return (
    <div className="container flex justify-around mt-4 mb-8">
      {/* back button */}
      <button
        onClick={() => handleNewStep()}
        className={`bg-white text-slate-400 uppercase py-2 px-4 rounded-xl font-semibold border-2 border-slate-300 hover:bg-slate-700 hover:text-white transition duration-200 ease-in-out ${
          currentStep === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        Back
      </button>

      {/* next button */}
      <button
        onClick={() => handleNextButton()}
        className="bg-green-500 text-white uppercase py-2 px-4 rounded-xl font-semibold cursor-pointer  hover:bg-slate-700 hover:text-white transition duration-200 ease-in-out"
      >
        {currentStep === totalSteps.length - 1 ? "Submit" : "Next"}
      </button>
    </div>
  );
};

export default FormMoverControl;
