type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  }, //USER + SESSION
  {
    name: "Create User (put google drive url for profile pic or leave empty for default picture)",
    endpoint: "/api/users",
    method: "POST",
    fields: { email: "input", password: "input", name: "input", birthday: "input", profilePic: "input", city: "input", state: "input", country: "input", userType: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { email: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { email: "input", password: "input", name: "input", birthday: "input", city: "input", state: "input", country: "input" }, profilePic: "input" },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users by name (empty for all)",
    endpoint: "/api/users",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Get Users by id (empty for all)",
    endpoint: "/api/users/:id",
    method: "GET",
    fields: { id: "input" },
  }, //FOCUSED POST CATEGORIES
  {
    name: "Create Focused Post Category",
    endpoint: "/api/categories",
    method: "POST",
    fields: { name: "input", description: "input" },
  },
  {
    name: "Get Category (or all if left empty)",
    endpoint: "/api/categories",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Delete a category and all its posts",
    endpoint: "/api/categories",
    method: "DELETE",
    fields: { id: "input" },
  }, //FOCUSED POSTS
  {
    name: "Get Focused Posts by author email (will take priority if you enter both) or id (empty for all)",
    endpoint: "/api/focusedPosts",
    method: "GET",
    fields: { authorEmail: "input", _id: "input" },
  },
  {
    name: "Create Focused Post (seperate google drive media URLs by ', ')",
    endpoint: "/api/focusedPosts",
    method: "POST",
    fields: { content: "input", mediaURLs: "input", categoryID: "input" },
  },
  {
    name: "Update Focused Post (you can update category by putting a new ID)",
    endpoint: "/api/focusedPosts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", category: "input" } },
  },
  {
    name: "Delete Focused Post (and all its tags)",
    endpoint: "/api/focusedPosts",
    method: "DELETE",
    fields: { id: "input" },
  }, //CONNECTIONS
  {
    name: "Get connections for a user by their ID",
    endpoint: "/api/connections/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "See your connection requests",
    endpoint: "/api/connections/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Remove a connection by the other user's ID",
    endpoint: "/api/connections/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Send a connection request to someone",
    endpoint: "/api/connections/requests",
    method: "POST",
    fields: { receiverId: "input" },
  },
  {
    name: "Cancel a connection request to someone by their ID",
    endpoint: "/api/connections/requests/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Accept a connection request from someone by their ID",
    endpoint: "/api/connections/accept/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Reject a connection request from someone by their ID",
    endpoint: "/api/connections/reject/:id",
    method: "PATCH",
    fields: { id: "input" },
  }, //COMMENTS
  {
    name: "Get comments for a post (don't leave empty)",
    endpoint: "/api/comments/post/:postId",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Add a comment by post id",
    endpoint: "/api/comments",
    method: "POST",
    fields: { post: "input", content: "input" },
  },
  {
    name: "Edit a comment by its ID",
    endpoint: "/api/comments",
    method: "PATCH",
    fields: { _id: "input", newContent: "input" },
  },
  {
    name: "Delete a comment by its ID",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  }, //TAGS
  {
    name: "Get tags for a post",
    endpoint: "/api/tags/post/:postId",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Get tags for a user",
    endpoint: "/api/tags/user/:userId",
    method: "GET",
    fields: { userId: "input" },
  },
  {
    name: "Add a tag by user id and post id",
    endpoint: "/api/tags",
    method: "POST",
    fields: { post: "input", tagged: "input" },
  },
  {
    name: "Delete a tag by user id and post id",
    endpoint: "/api/tags",
    method: "DELETE",
    fields: { post: "input", tagged: "input" },
  }, //CHALLENGES
  {
    name: "Propose a Challenge",
    endpoint: "/api/challenge",
    method: "POST",
    fields: { prompt: "input" },
  },
  {
    name: "Get today's challenge (new ones get posted every day)",
    endpoint: "/api/challenge/today",
    method: "GET",
    fields: {},
  },
  {
    name: "Get the IDs of users who accepted today's challenge (for frontend purposes)",
    endpoint: "/api/challenge/accepted",
    method: "GET",
    fields: {},
  },
  {
    name: "Get posted Challenge by id (leave empty for all)",
    endpoint: "/api/challenge",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Accept today's Challenge by posting content (seperate Google Drive media URLs using ', ')",
    endpoint: "/api/acceptChallenge",
    method: "GET",
    fields: { content: "input", mediaURLs: "input" },
  }, //APPLAUSE
  {
    name: "Get your own applause count",
    endpoint: "/api/applause",
    method: "GET",
    fields: {},
  }, //OPPORTUNITY
  {
    name: "List an opportunity by id (leave empty for all)",
    endpoint: "/api/opportunities/id",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Get opportunities posted by user by their ID",
    endpoint: "/api/opportunities/user/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "See if an opportunity fits in date range (enter opportunity id, start date and end date)",
    endpoint: "/api/opportunities/inRange",
    method: "GET",
    fields: { id: "input", start: "input", end: "input" },
  },
  {
    name: "Create an opportunity",
    endpoint: "/api/opportunities",
    method: "POST",
    fields: { title: "input", description: "input", startOn: "input", endsOn: "input", requirements: { physical: "input", skill: "input", location: "input" } },
  },
  {
    name: "Edit an existing opportunity (if you're the owner)",
    endpoint: "/api/opportunities",
    method: "PATCH",
    fields: { id: "input", update: { description: "input", startOn: "input", endsOn: "input" } },
  },
  {
    name: "Deactivate an opportunity by its id (if you are the owner)",
    endpoint: "/api/opportunities/deactivate",
    method: "PATCH",
    fields: { _id: "input" },
  },
  {
    name: "Reactivate an opportunity by its id (if you're the owner)",
    endpoint: "/api/opportunities/reactivate",
    method: "PATCH",
    fields: { _id: "input" },
  },
  {
    name: "Delete an opportunity by its ID (if you're the owner)",
    endpoint: "/api/opportunities/:id",
    method: "DELETE",
    fields: { id: "input" },
  }, //APPLICATIONS
  {
    name: "Get all applications for an opportunity you own using its id",
    endpoint: "/api/application/opportunity",
    method: "GET",
    fields: { opId: "input" },
  },
  {
    name: "Get applications you submitted",
    endpoint: "/api/application",
    method: "GET",
    fields: {},
  },
  {
    name: "Get application by id",
    endpoint: "/api/application/:_id",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Create and submit an application (seperate Google Drive media URLs by ', ')",
    endpoint: "/api/application",
    method: "POST",
    fields: { text: "input", media: "input", opId: "input" },
  },
  {
    name: "Change the status for an opportunity (can change to withdrawn if applier or to rejected, approved or audition if opportunity owner).",
    endpoint: "/api/application",
    method: "PATCH",
    fields: { id: "input", newStatus: "input" },
  }, //PORTFOLIO
  {
    name: "Get user's portfolio",
    endpoint: "/api/portfolio/:userId",
    method: "GET",
    fields: { userId: "input" },
  },
  {
    name: "Edit your portfolio (headshot needs to be a media ID",
    endpoint: "/api/portfolio",
    method: "PATCH",
    fields: {
      update: {
        style: { backgroundImage: "input", backGroundColor: "input", font: "input", textColor: "input" },
        info: { education: "input", experience: "input", skills: "input", languages: "input" },
        intro: "input",
      },
      headshot: "input",
    },
  },
  {
    name: "Add media on portfolio (one google drive link)",
    endpoint: "/api/portfolio/media/add",
    method: "PATCH",
    fields: { media: "input" },
  },
  {
    name: "Remove media from portfolio (one google drive link)",
    endpoint: "/api/portfolio/media/remove",
    method: "PATCH",
    fields: { media: "input" },
  }, //FOLDER
  {
    name: "Get your practice folder",
    endpoint: "/api/practicefolder",
    method: "GET",
    fields: {},
  },
  {
    name: "Add one url of any kind to practice folder",
    endpoint: "/api/practicefolder/add",
    method: "PATCH",
    fields: { content: "input" },
  },
  {
    name: "Remove one url from practice folder",
    endpoint: "/api/practicefolder/remove",
    method: "PATCH",
    fields: { content: "input" },
  },
  {
    name: "Get capacity limit for practice folders",
    endpoint: "/api/practicefolder/settings",
    method: "GET",
    fields: {},
  },
  {
    name: "Change the limit for practice folders (if admin)",
    endpoint: "/api/practicefolder/settings",
    method: "PATCH",
    fields: { capacityLimit: "input" },
  }, //REPERTOIRE
  {
    name: "Get repertoire folder by its id",
    endpoint: "/api/repertoirefolders",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Get the repertiore folders for a given user by their id",
    endpoint: "/api/repertoirefolders/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Create a new repertoire folder (if actor)",
    endpoint: "/api/repertoirefolders",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Add a url of any kind to your repertoire folder by its id",
    endpoint: "/api/repertoirefolders/add",
    method: "PATCH",
    fields: { content: "input", folder: "input" },
  },
  {
    name: "Remove a url of any kind from your repertoire folder by its id",
    endpoint: "/api/repertoirefolders/remove",
    method: "PATCH",
    fields: { content: "input", folder: "input" },
  },
  {
    name: "Delete a repertoire folder by its id",
    endpoint: "/api/repertoirefolders",
    method: "DELETE",
    fields: { _id: "input" },
  }, //QUEUE
  // {
  //   name: "Initialize a queue for an opportunity by its id with a number representing the length in minutes of the audition per person as well as the start date and time",
  //   endpoint: "/api/queue",
  //   method: "POST",
  //   fields: { queueFor: "input", timePerPerson: "input", startTime: "input" },
  // },
  // {
  //   name: "Get your estimated audition start time (for actor who applied) with opporunity's id",
  //   endpoint: "/api/queue/estimatedTime",
  //   method: "GET",
  //   fields: { queueFor: "input" },
  // },
  // {
  //   name: "Move to next in queue (by opportunity's id) and input the status of the previous canditate (approved/rejected). Leave status empty if this is the first candidate",
  //   endpoint: "/api/queue",
  //   method: "PATCH",
  //   fields: { _id: "input", newStatusPrev: "input" },
  // },
  // {
  //   name: "Delete queue by opportunity id",
  //   endpoint: "/api/queue",
  //   method: "DELETE",
  //   fields: { _id: "input" },
  // }, //RESTRICTIONS
  {
    name: "Get your account types",
    endpoint: "/api/restrictions",
    method: "GET",
    fields: {},
  },
  {
    name: "Get account types for a user by their ID",
    endpoint: "/api/restrictions/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Check if there are any admins at the moment",
    endpoint: "/api/anyAdmins",
    method: "GET",
    fields: {},
  },
  {
    name: "Update your account types (seperate types with ', '. Valid types are admin, casting director, and actor)",
    endpoint: "/api/restrictions",
    method: "PATCH",
    fields: { accountTypes: "input" },
  }, //VOTES
  {
    name: "Get a posts votes by the post's id",
    endpoint: "/api/vote",
    method: "GET",
    fields: { post: "input" },
  },
  {
    name: "Upvote or downvote a post by its id (use a boolean to control upvote). You can delete entering the same vote twice in a row. To change a vote, simply enter the other boolean for upvote.",
    endpoint: "/api/vote",
    method: "POST",
    fields: { post: "input", upvote: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
