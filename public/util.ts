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
  },
  {
    name: "Create User (put google drive url for profile pic or leave empty)",
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
    name: "Get Users (empty for all)",
    endpoint: "/api/users",
    method: "GET",
    fields: { name: "input" },
  },
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
  },
  {
    name: "Get Focused Posts by author email or id (empty for all)",
    endpoint: "/api/focusedPosts",
    method: "GET",
    fields: { authorEmail: "input", _id: "input" },
  },
  {
    name: "Create Focused Post (seperate google drive media by ', ')",
    endpoint: "/api/focusedPosts",
    method: "POST",
    fields: { content: "input", mediaURLs: "input", category: "input" },
  },
  {
    name: "Update Focused Post",
    endpoint: "/api/focusedPosts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", category: "input" } },
  },
  {
    name: "Delete Focused Post (and all its tags)",
    endpoint: "/api/focusedPosts",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get your connections",
    endpoint: "/api/connections",
    method: "GET",
    fields: {},
  },
  {
    name: "See your connection requests",
    endpoint: "/api/connections/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Remove a connection",
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
    name: "Cancel a connection request to someone",
    endpoint: "/api/connections/requests/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Accept a connection request from someone",
    endpoint: "/api/connections/accept/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Reject a connection request from someone",
    endpoint: "/api/connections/reject/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Get comments for a post (don't leave empty)",
    endpoint: "/api/comments/post/:postId",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Get comment by id",
    endpoint: "/api/comments",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Add a comment by post id",
    endpoint: "/api/comments",
    method: "POST",
    fields: { post: "input", content: "input" },
  },
  {
    name: "Edit a comment",
    endpoint: "/api/comments/:id",
    method: "PATCH",
    fields: { id: "input", newContent: "input" },
  },
  {
    name: "Delete a comment",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
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
  },
  {
    name: "Propose a Challenge",
    endpoint: "/api/challenges",
    method: "POST",
    fields: { prompt: "input" },
  },
  {
    name: "Post a Challenge at random",
    endpoint: "/api/challenges/post",
    method: "POST",
    fields: {},
  },
  {
    name: "Get posted Challenge by id (leave empty for all)",
    endpoint: "/api/challenges",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "Get your own applause count",
    endpoint: "/api/applause",
    method: "GET",
    fields: {},
  },
  {
    name: "List an opportunity by id (leave empty for all)",
    endpoint: "/api/opportunities/id",
    method: "GET",
    fields: { _id: "input" },
  },
  {
    name: "List an opportunity by title",
    endpoint: "/api/opportunities/title/:searched",
    method: "GET",
    fields: { searched: "input" },
  },
  {
    name: "List an opportunity by user",
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
    name: "Edit an existing opportunity",
    endpoint: "/api/opportunities",
    method: "PATCH",
    fields: { id: "input", update: { description: "input", startOn: "input", endsOn: "input" } },
  },
  {
    name: "Deactivate an opportunity by id",
    endpoint: "/api/opportunities/deactivate/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Reactivate an opportunity by id",
    endpoint: "/api/opportunities/reactivate/:id",
    method: "PATCH",
    fields: { id: "input" },
  },
  {
    name: "Delete an opportunity",
    endpoint: "/api/opportunities/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
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
    name: "Create and submit an application (seperate media urls by a comma and a space)",
    endpoint: "/api/application",
    method: "POST",
    fields: { portfolioId: "input", text: "input", media: "input", opId: "input" },
  },
  {
    name: "Change the status for an opportunity (can change to withdraw if applier or to rejected, approved or audition if opportunity owner)",
    endpoint: "/api/application",
    method: "PATCH",
    fields: { id: "input", newStatus: "input" },
  },
  {
    name: "Get user's portfolio",
    endpoint: "/api/portfolio/:userId",
    method: "GET",
    fields: { userId: "input" },
  },
  {
    name: "Create a portfolio (if actor type user)",
    endpoint: "/api/portfolio",
    method: "POST",
    fields: {
      style: { backgroundImage: "input", backGroundColor: "input", font: "input", textColor: "input" },
      info: { education: "input", experience: "input", skills: "input", languages: "input" },
      intro: "input",
      media: "input",
      headshot: "input",
    },
  },
  {
    name: "Update your portfolio",
    endpoint: "/api/portfolio",
    method: "PATCH",
    fields: {
      update: {
        style: { backgroundImage: "input", backGroundColor: "input", font: "input", textColor: "input" },
        info: { education: "input", experience: "input", skills: "input", languages: "input" },
        intro: "input",
        headshot: "input",
      },
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
  },
  {
    name: "Get your practice folder",
    endpoint: "/api/practicefolder",
    method: "GET",
    fields: {},
  },
  {
    name: "Add one url to practice folder",
    endpoint: "/api/practicefolder/add",
    method: "PATCH",
    fields: { content: "input" },
  },
  {
    name: "Remove one url (by media id) from practice folder",
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
  },
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
    name: "Add a media object (by google drive url) to your repertoire by its id",
    endpoint: "/api/repertoirefolders/add",
    method: "PATCH",
    fields: { content: "input", folder: "input" },
  },
  {
    name: "Remove a media object (by its id) from your repertoire by its id",
    endpoint: "/api/repertoirefolders/remove",
    method: "PATCH",
    fields: { content: "input", folder: "input" },
  },
  {
    name: "Delete a repertoire folder by its id",
    endpoint: "/api/repertoirefolders",
    method: "DELETE",
    fields: { _id: "input" },
  },
  {
    name: "Initialize a queue for an opportunity by its id",
    endpoint: "/api/queue",
    method: "POST",
    fields: { queueFor: "input", timePerPerson: "input", startTime: "input" },
  },
  {
    name: "Get your estimated audition start time (for actor who applied)",
    endpoint: "/api/queue/estimatedTime",
    method: "GET",
    fields: { queueFor: "input" },
  },
  {
    name: "Move to next in queue (by opportunity's id) and input the status of the previous canditate (approved/rejected) unless this is the first candidate",
    endpoint: "/api/queue",
    method: "PATCH",
    fields: { _id: "input", newStatusPrev: "input" },
  },
  {
    name: "Delete queue by opportunity id",
    endpoint: "/api/queue",
    method: "DELETE",
    fields: { _id: "input" },
  },
  {
    name: "Get your account types",
    endpoint: "/api/restrictions",
    method: "GET",
    fields: {},
  },
  {
    name: "Update your account types (seperate types with ', '. Valid types are admin, casting director, and actor)",
    endpoint: "/api/restrictions",
    method: "PATCH",
    fields: { accountTypes: "input" },
  },
  {
    name: "Get a posts votes by the post's id",
    endpoint: "/api/vote",
    method: "GET",
    fields: { post: "input" },
  },
  {
    name: "Upvote a post by its id",
    endpoint: "/api/vote/upvote",
    method: "POST",
    fields: { post: "input" },
  },
  {
    name: "Downvote a post by its id",
    endpoint: "/api/vote/downvote",
    method: "POST",
    fields: { post: "input" },
  },
  {
    name: "Delete a vote on a given post by the post's id",
    endpoint: "/api/vote",
    method: "DELETE",
    fields: { post: "input" },
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
