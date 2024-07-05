// ? Grab references to the important DOM elements.
const timeDisplayEl = $("#time-display");
const projectDisplayEl = $(".swim-lanes");
const projectFormEl = $("#project-form");
const projectNameInputEl = $("#project-name-input");
const projectTypeInputEl = $("#project-type-input");
const projectDateInputEl = $("#taskDueDate");

// ? Helper function that displays the time, this is called every second in the setInterval function below.
function displayTime() {
  const rightNow = dayjs().format("MMM DD, YYYY [at] hh:mm:ss a");
  timeDisplayEl.text(rightNow);
}

function readProjectsFromStorage() {
  let projects = JSON.parse(localStorage.getItem("projects"));
  if (!projects) {
    projects = [];
  }
  return projects;
}

//Create a function that accepts an array of projects, stringifys them, and saves them in localStorage.
function saveProjectsToStorage(projects) {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// ? Creates a project card from the information passed in `project` parameter and returns it.
function createProjectCard(project) {
  // Create a new card element and add the classes `card`, `project-card`, `draggable`, and `my-3`. Also add a `data-project-id` attribute and set it to the project id.
  const newProjCard = $("<div>");
  newProjCard.addClass("card project-card draggable my-3");
  newProjCard.attr("data-project-id", project.id);
  //Create a new card header element and add the classes `card-header` and `h4`. Also set the text of the card header to the project name.
  const cardHeader = $("<h4>");
  cardHeader.addClass("card-header h4");
  cardHeader.text(project.name);
  //Create a new card body element and add the class `card-body`.
  const cardBody = $("<div>");
  cardBody.addClass("card-body");
  //Create a new paragraph element and add the class `card-text`. Also set the text of the paragraph to the project type.
  const cardPara = $("<p>");
  cardPara.addClass("card-text");
  cardPara.text(project.type);
  //Create a new paragraph element and add the class `card-text`. Also set the text of the paragraph to the project due date.
  const duePara = $("<p>");
  duePara.addClass("card-text");
  duePara.text(project.dueDate);
  //Create a new button element and add the classes `btn`, `btn-danger`, and `delete`. Also set the text of the button to "Delete" and add a `data-project-id` attribute and set it to the project id.
  const delBtn = $("<nutton>");
  delBtn.addClass("btn btn-danger delete");
  delBtn.text("Delete");
  delBtn.attr("data-project-id", project.id);

  // ? Sets the card background color based on due date. Only apply the styles if the dueDate exists and the status is not done.
  if (project.dueDate && project.status !== "done") {
    const now = dayjs();
    const taskDueDate = dayjs(project.dueDate, "DD/MM/YYYY");

    // ? If the task is due today, make the card yellow. If it is overdue, make it red.
    if (now.isSame(taskDueDate, "day")) {
      newProjCard.addClass("bg-warning text-white");
    } else if (now.isAfter(taskDueDate)) {
      newProjCard.addClass("bg-danger text-white");
      delBtn.addClass("border-light");
    }
  }

  // Append the card description, card due date, and card delete button to the card body.
  // Append the card header and card body to the card.
  cardBody.append(cardPara, duePara, delBtn);
  newProjCard.append(cardHeader, cardBody);
  // ? Return the card so it can be appended to the correct lane.
  return newProjCard;
}

function printProjectData() {
  const projects = readProjectsFromStorage();

  // ? Empty existing project cards out of the lanes
  const todoList = $("#todo-cards");
  todoList.empty();

  const inProgressList = $("#in-progress-cards");
  inProgressList.empty();

  const doneList = $("#done-cards");
  doneList.empty();

  //  Loop through projects and create project cards for each status
  for (let project of projects) {
    const newCard = createProjectCard(project);
    if (project.status === "to-do") {
      todoList.append(newCard);
    } else if (project.status === "in-progress") {
      inProgressList.append(newCard);
    } else {
      doneList.append(newCard);
    }
  }

  // ? Use JQuery UI to make task cards draggable
  $(".draggable").draggable({
    opacity: 0.7,
    zIndex: 100,
    // ? This is the function that creates the clone of the card that is dragged. This is purely visual and does not affect the data.
    helper: function (e) {
      // ? Check if the target of the drag event is the card itself or a child element. If it is the card itself, clone it, otherwise find the parent card  that is draggable and clone that.
      const original = $(e.target).hasClass("ui-draggable")
        ? $(e.target)
        : $(e.target).closest(".ui-draggable");
      // ? Return the clone with the width set to the width of the original card. This is so the clone does not take up the entire width of the lane. This is to also fix a visual bug where the card shrinks as it's dragged to the right.
      return original.clone().css({
        width: original.outerWidth(),
      });
    },
  });
}

// ? Removes a project from local storage and prints the project data back to the page
function handleDeleteProject() {
  const projectId = $(this).attr("data-project-id");
  console.log(projectId);
  const projects = readProjectsFromStorage();

  //Loop through the projects array and remove the project with the matching id.
  for (let i = 0; i < projects.length; i++) {
    if (projects[i].id === projectId) {
      projects.splice(i, 1);
    }
  }
  // ? We will use our helper function to save the projects to localStorage
  saveProjectsToStorage(projects);

  // ? Here we use our other function to print projects back to the screen
  printProjectData();
}

// ? Adds a project to local storage and prints the project data
function handleProjectFormSubmit(event) {
  event.preventDefault();

  //  Get the project name, type, and due date from the form
  const projectName = projectNameInputEl.val();
  const projectType = projectTypeInputEl.val();
  const projectDate = projectDateInputEl.val();
  // ? Create a new project object with the data from the form
  const newProject = {
    // ? Here we use a tool called `crypto` to generate a random id for our project. This is a unique identifier that we can use to find the project in the array. `crypto` is a built-in module that we can use in the browser and Nodejs.
    id: crypto.randomUUID(),
    name: projectName,
    type: projectType,
    dueDate: projectDate,
    status: "to-do",
  };

  // ? Pull the projects from localStorage and push the new project to the array
  const projects = readProjectsFromStorage();
  projects.push(newProject);

  // ? Save the updated projects array to localStorage
  saveProjectsToStorage(projects);

  // ? Print project data back to the screen
  printProjectData();

  //  Clear the form inputs
  projectNameInputEl.val("");
  projectTypeInputEl.val("");
  projectDateInputEl.val("");
}

// ? This function is called when a card is dropped into a lane. It updates the status of the project and saves it to localStorage. You can see this function is called in the `droppable` method below.
function handleDrop(event, ui) {
  // ? Read projects from localStorage
  const projects = readProjectsFromStorage();

  // ? Get the project id from the event
  const taskId = ui.draggable[0].dataset.projectId;

  // ? Get the id of the lane that the card was dropped into
  const newStatus = event.target.id;

  for (let project of projects) {
    // ? Find the project card by the `id` and update the project status.
    if (project.id === taskId) {
      project.status = newStatus;
    }
  }
  // ? Save the updated projects array to localStorage (overwritting the previous one) and render the new project data to the screen.
  localStorage.setItem("projects", JSON.stringify(projects));
  printProjectData();
}

// ? Add event listener to the form element, listen for a submit event, and call the `handleProjectFormSubmit` function.
projectFormEl.on("submit", handleProjectFormSubmit);

projectDisplayEl.on("click", ".delete", handleDeleteProject);

// ? Call the `displayTime` function once on page load and then every second after that.
displayTime();
setInterval(displayTime, 1000);

// ? When the document is ready, print the project data to the screen and make the lanes droppable. Also, initialize the date picker.
$(document).ready(function () {
  // ? Print project data to the screen on page load if there is any
  printProjectData();

  $("#taskDueDate").datepicker({
    changeMonth: true,
    changeYear: true,
  });

  // ? Make lanes droppable
  $(".lane").droppable({
    accept: ".draggable",
    drop: handleDrop,
  });
});
