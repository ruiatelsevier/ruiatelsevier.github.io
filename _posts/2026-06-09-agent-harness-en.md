---
title: "Agent Harness: The System Around the Model"
date: 2026-06-09
permalink: /posts/2026/06/agent-harness-en/
tags:
  - AI technology
  - agent
  - harness-engineering
  - writing
translation_url: /posts/2026/06/agent-harness/
translation_label: "阅读中文版"
language_label: "Language"
---

When people talk about AI agents, the discussion usually starts with the model. A better model makes for a better agent, the argument goes. That is true up to a point, but it leaves out a large part of what makes an agent useful in practice.

The same large language model can behave very differently depending on the system around it. In a chat box, it might tell you how to change a piece of code. In a coding environment, it might open the repository, search the files, make the edit, run the tests, read the failure log, and try again. The model may be roughly the same. The work setup is not.

That setup is what I mean by the agent harness.

![Agent Harness connects the model, context, tools, permissions, verification, and state into an executable system](/images/harness.png)

## Why the Model Alone Is Not Enough

Consider a dull but familiar bug: the button on a login page does nothing.

If you paste that sentence into a normal chat model, it can give sensible advice based on whatever code you include. It might ask you to check the click handler, confirm that the button is not disabled, or look at the browser console. That is useful as far as it goes. The model cannot enter your project, inspect the actual code path, or verify that anything has changed.

In a coding agent, the same request becomes an executable task. The agent can read the project instructions, find the login page, inspect the handler, follow the state update, check logs, edit the code, run the relevant tests, and open the page to click the button. If the first change fails, the failure output becomes the next clue rather than the end of the conversation.

It is easy to give the model all the credit here because the model is the visible part. But the real difference is often quieter: what information the system provides, what actions it allows, how it reports failure, and how it decides whether the work is actually complete.

That surrounding system is the harness. It is not the glamorous part of the agent, but it is often the part that determines whether the model merely talks through a task or can work through it with some discipline.

## What Is an Agent Harness?

I think of an agent harness as the part of the system that gives the model a place to work. It provides the context the model sees, the tools it can use, the permissions around those tools, the environment where actions happen, and the checks that determine whether the work succeeded.

That sounds abstract, but the practical questions are straightforward. What information does the model see before it acts? Which tools can it call? Where can those tools read and write? Which actions require approval? How does the system know that the result is correct? What happens if the task lasts longer than the current context window?

Tool calling is only one piece of this. A file reader, shell, browser, database client, or web search tool is just an interface. The harness decides how those tools are described, when they are exposed, how their output is returned, and whether risky calls are blocked or reviewed.

The goal is not really to make the model seem smarter. It is to make the useful parts of its behavior show up more often, and under conditions you can understand.

## What People Often Get Wrong

It is tempting to reduce the harness to a prompt. Prompts matter, but they are only the entry point. A harness also includes the tools the model can use, the permission model around those tools, the runtime where actions happen, and the checks that decide whether the answer is good enough.

It is also tempting to reduce the harness to tool calling. That misses the harder part. Giving the model a list of APIs does not mean it knows when to use them, which ones are safe, what a failure means, or whether the result needs another check. Access to tools is not the same thing as reliable task execution.

Frameworks and harnesses are related but not identical. A framework helps developers assemble an agent application. A harness is more concerned with runtime behavior: how context is loaded, how tools are selected, how boundaries are enforced, and how the system recovers when something fails.

Stronger models do not remove the need for a harness. In practice, they often raise the stakes for it. A chat-only model can produce a wrong answer. A model that can edit files, run commands, access databases, or call external services can create real side effects. More capability requires clearer boundaries, not fewer.

The same caution applies to multi-agent designs. Several agents can be useful when a task genuinely splits into independent parts or when separate judgment is valuable. They can also introduce coordination overhead, conflicting assumptions, and additional handoff work. More agents are an architectural choice, not an automatic upgrade.

## Why the Harness Changes the Result

Small details in the harness can change the outcome of the same task.

Context is often the first place this shows up. If the model does not know the project structure, it guesses. If it receives stale notes or the wrong file, it may spend time pursuing a plausible but irrelevant path. Context is not valuable simply because there is more of it. It matters because it shapes what the model believes the problem actually is.

Tool interfaces matter just as much. Poor descriptions, awkward input formats, and noisy outputs make the next step harder to infer. A command that returns 500 lines of unstructured logs may contain the answer, but the model still has to find it.

Feedback loops determine whether mistakes can be corrected. Tests, logs, browser state, API responses, and build output all give the agent a way to compare intention with reality. Without those signals, it is often judging by plausibility alone.

Permissions are where the product has to make an uncomfortable tradeoff. If every action needs approval, the agent becomes slow and irritating. If nothing needs approval, a single bad judgment can have real consequences. Most useful systems settle somewhere in between: low-risk reads can run freely, sensitive writes require approval, and destructive actions remain off limits.

Verification changes what “finished” means. Without it, the agent is mostly stopping when the answer feels plausible. With it, the agent has evidence that the work survived contact with the real task.

Observability usually becomes important only after something breaks. Then the questions are painfully basic: what did the agent read, what did it change, which command failed, and why did it stop?

This is why two products built on the same model can feel so different. One gives the model a cramped chat window and a vague tool list. Another provides relevant files, clean tool output, scoped permissions, and checks that feed directly into the next step. The model name alone does not tell you which experience you are getting.

## What the Harness Controls When a Coding Agent Actually Works

Go back to the login button.

A workable harness does not simply forward the user's sentence. It adds project instructions, the current working directory, relevant history, safety constraints, and enough file context for the model to begin without guessing blindly.

The agent then works through a loop. It asks what it needs to know next. Where is the button defined? Which framework is used? Is the click handler bound? Is the request failing? Is the browser console showing an exception?

It searches or reads files, observes the result, and updates its plan. If the handler is missing, it edits the component. If the handler exists but an API call fails, it follows the request path. If the UI state changes but the page still looks frozen, it checks the browser.

After an edit, a serious agent does not immediately declare victory. It runs a test or checks the page directly. A failed test is not merely a red mark; it becomes the next observation. The loop continues until the evidence is strong enough, the system blocks an action, or the task runs out of useful information.

This resembles human debugging, but the process does not appear automatically just because the model is good at language. The harness is what makes the process executable, visible, and bounded.

## Context Is a Product Surface

Context is one of the main design surfaces of an agent system.

For a coding agent, useful context may include repository structure, test commands, local conventions, files already inspected, recent failures, and directories that should not be touched. For a research or data agent, it might include source documents, schema descriptions, provenance, and previous intermediate results.

The obvious mistake is to include everything. Large context windows can look helpful while burying the important details beneath noise. Old instructions, obsolete failures, and irrelevant files can pull the model toward work that no longer matters.

A harness therefore has to assemble context deliberately. It needs to retrieve the right material, compress long histories without losing key facts, and leave enough room for reasoning and output. That may sound mundane, but poor context management is one of the fastest ways to make a capable model look confused.

Long tasks make the problem even more visible. After enough turns, the conversation history becomes a poor state store. A structured handoff note is often more useful: current goal, decisions made, things tried, checks passed, failures still unexplained, and the next likely step. The point is not to preserve every sentence of the conversation. It is to preserve the state required to continue.

## Tools Need Design, Not Just Access

Tools are how a model leaves the page.

Common tools include file operations, shell commands, browser control, search, databases, APIs, and external integrations exposed through protocols such as MCP. More powerful tools let an agent do more, but they also make interface design more important.

A useful tool description tells the model when to use the tool, what input shape it expects, what the output means, and what common failures look like. This is not documentation for humans alone. It is part of the agent's operating environment.

Messy tool output makes agents brittle. A search tool with an unclear scope wastes time. A shell tool that returns an undifferentiated log forces the model to guess which line matters. A browser tool without console output may confirm that a page exists while hiding the actual error.

There is also such a thing as too many tools. A large static menu can pollute context and make tool selection harder. Mature systems often expose capabilities dynamically through skill menus, registries, or context-specific tools that appear only when relevant.

In the login-page example, the file tool finds the component, the shell runs tests, and the browser checks the real UI. Remove any one of them and the task becomes less grounded. Remove all of them and the agent is back to giving advice.

## Permission Is Part of the Product

Once an agent can read files, write files, run commands, and call the network, safety cannot be bolted on later.

The harness has to decide which actions can happen automatically, which require approval, and which are not allowed at all. Human confirmation is useful, but it is not a complete answer. If the agent asks for approval constantly, users become numb. If the risk is hidden inside a complicated command, the user may not understand what they are approving.

Risk grading scales better. Reading a file is usually low risk. Writing inside the current workspace may be acceptable with guardrails. Touching credentials, external services, databases, or destructive filesystem operations should face stricter review or be blocked entirely. Sandboxing then limits the blast radius when the model misjudges a situation.

Some systems add automated review for high-risk actions. The important detail is that the review should examine the action itself, not merely the model's explanation for it. Explanations can be persuasive and still be wrong.

Permissions are not a wrapper around the harness. They are part of the harness.

## The Loop Is Where Reliability Comes From

Useful agents rarely solve meaningful work in a single response.

In a real task, the useful part is usually not the first guess. It is the loop that follows: decide what to do, act, observe what happened, and revise the plan.

That loop is what allows recovery. A test failure becomes evidence. A browser console error points to a new file. A permission denial changes the route. An unexpected API response forces the agent to update its assumptions.

The harness also needs stopping conditions. The task may be complete. A relevant check may have passed. Required information may be missing. A permission boundary may have been reached. The budget may be exhausted. Without stopping conditions, an agent can spin indefinitely. With premature stopping, it delivers work that was never properly checked.

For agent work, the quality of that loop often matters more than the brilliance of the first answer.

## Verification Is Where the Agent Proves It Worked

Many agent demos stop at plausibility. The output looks right, the explanation is fluent, and the model sounds confident. In actual work, that is rarely enough.

Verification depends on the task. Code changes may call for unit tests, type checks, linting, builds, or browser interaction. API work may require checking status codes and response shapes. Data work may require row counts, schema checks, outlier inspection, or logs.

Not every task needs every check. A wording change does not need the same treatment as a login-flow change. The principle is simpler than the checklist: verification should match the risk.

For the login button, a useful final report is not just “fixed.” It explains what changed and what was checked. The handler binding was corrected. The relevant test passed. The page was opened and the button was confirmed to change state. The evidence is part of the deliverable.

## State Has to Live Somewhere

Short tasks can live inside the current prompt. Longer tasks need something sturdier.

A task that runs across dozens of turns, multiple tools, or more than one session cannot rely on the model remembering everything. The harness needs a state store. Often the simplest option is the file system: plans, logs, test results, handoff notes, known risks, and open questions can all be written down for the next run.

This is less glamorous than “agent memory,” but it is often what actually helps. A boring handoff note can answer the questions that matter: what are we trying to do, what already failed, what passed, and where should the next run begin?

Good agent systems make this state explicit and inspectable. Hidden memory is difficult to debug. A plain handoff file can be surprisingly effective.

## Multi-Agent Systems Are Not a Free Upgrade

Multi-agent setups are useful when the work genuinely benefits from separation.

That can happen when the context is too large for one agent, when several parts can be explored in parallel, or when independent review is valuable. Common patterns include a planner with workers, a generator with an evaluator, fan-out/fan-in research, or a supervisor coordinating narrower agents.

But splitting work creates its own problems. Each agent sees only part of the picture. Conclusions can conflict. Teams of agents need clear scope, minimal shared context, explicit handoffs, timeouts, and ways to recover failed branches. Without those things, the system may spend more effort coordinating than solving.

In many ordinary tasks, I would rather have one agent with good context, tools, and verification than several agents passing partial summaries around.

## From Local Harness to Production Runtime

A local harness is concerned with getting one task done. A production runtime has a broader job.

An agent product needs persistent sessions, resumable execution, task scheduling, credential boundaries, on-demand environments, audit logs, and user notifications. It also needs to store more than the next model prompt. It has to remember which files were opened, which commands ran, which checks are pending, and which permissions the user has already granted.

This distinction matters. Model calls can be stateless, but work cannot. The model may be invoked fresh each time. The workspace, tool state, authorization state, and task state need continuity.

At that point, the harness is no longer a thin wrapper around an API call. It starts to look like runtime infrastructure.

## How to Evaluate an Agent Harness

The useful questions are not limited to “Which model does it use?”

Can the agent find the right context without drowning in irrelevant text? Are the tools described clearly enough for the model to use them correctly? When a tool fails, does the real error surface? Can a long task resume? Are dangerous actions intercepted? Is the result verified against the task? Can a human reconstruct what happened?

These questions are often closer to the actual user experience than parameter counts or model names.

An agent that cannot find the right information will guess. An agent that cannot verify its work will often sound better than it performs. An agent without permission boundaries becomes riskier as it becomes more capable.

## Where Software Engineering Shifts

The shift is practical before it is philosophical.

If agents are going to operate inside real repositories and production systems, those environments need to be designed with that reality in mind. Repositories need to be readable by agents. Tools need outputs that models can consume. Tests and verification need to be easy to run. Permissions and state need to be designed rather than improvised.

This is ultimately why the harness matters. It is the layer that connects a model to context, tools, boundaries, feedback, and verification. Without it, the model gives advice. With it, the model can begin to take responsibility for work.


