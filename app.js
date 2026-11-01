(function () {
	const leagueRoot = document.getElementById("league");
	if (!leagueRoot) return;

	const storageKey = "leagueup-demo-league-v1";
	const initialLeague = {
		name: "Sunday League",
		teams: [
			{ id: "northside", name: "Northside FC" },
			{ id: "riverside", name: "Riverside Town" },
			{ id: "hilltop", name: "Hilltop Athletic" },
			{ id: "park", name: "Park United" }
		],
		matches: [
			{
				id: "match-1",
				homeTeamId: "northside",
				awayTeamId: "riverside",
				kickoffDate: "2026-10-25",
				homeScore: 2,
				awayScore: 1
			},
			{
				id: "match-2",
				homeTeamId: "hilltop",
				awayTeamId: "park",
				kickoffDate: "2026-10-26",
				homeScore: 1,
				awayScore: 1
			},
			{
				id: "match-3",
				homeTeamId: "riverside",
				awayTeamId: "hilltop",
				kickoffDate: "2026-11-08",
				homeScore: null,
				awayScore: null
			},
			{
				id: "match-4",
				homeTeamId: "park",
				awayTeamId: "northside",
				kickoffDate: "2026-11-09",
				homeScore: null,
				awayScore: null
			}
		],
		events: [
			{
				id: "event-1",
				title: "Midweek training",
				type: "Training",
				date: "2026-11-04",
				location: "Riverside Park",
				rsvps: [
					{ name: "Alex Morgan", status: "going" },
					{ name: "Jordan Lee", status: "maybe" }
				]
			},
			{
				id: "event-2",
				title: "End-of-week social",
				type: "Social",
				date: "2026-11-13",
				location: "Clubhouse",
				rsvps: []
			}
		],
		announcements: [
			{
				id: "announcement-1",
				title: "Welcome to the new season",
				body: "Fixtures are up. Please RSVP to training so we can plan the session.",
				createdAt: "2026-10-28T16:30:00.000Z"
			}
		]
	};

	function copyDemoEvents() {
		return initialLeague.events.map((event) => ({
			...event,
			rsvps: event.rsvps.map((rsvp) => ({ ...rsvp }))
		}));
	}

	function copyDemoAnnouncements() {
		return initialLeague.announcements.map((announcement) => ({ ...announcement }));
	}

	function loadLeague() {
		try {
			const savedLeague = JSON.parse(localStorage.getItem(storageKey));
			if (savedLeague && Array.isArray(savedLeague.teams) && Array.isArray(savedLeague.matches)) {
				return {
					name: typeof savedLeague.name === "string" ? savedLeague.name : initialLeague.name,
					teams: savedLeague.teams,
					matches: savedLeague.matches,
					events: Array.isArray(savedLeague.events) ? savedLeague.events : copyDemoEvents(),
					announcements: Array.isArray(savedLeague.announcements)
						? savedLeague.announcements
						: copyDemoAnnouncements()
				};
			}
		} catch (error) {
			console.warn("Could not load the saved league. Starting with the demo data.", error);
		}

		return {
			name: initialLeague.name,
			teams: initialLeague.teams.map((team) => ({ ...team })),
			matches: initialLeague.matches.map((match) => ({ ...match })),
			events: copyDemoEvents(),
			announcements: copyDemoAnnouncements()
		};
	}

	let league = loadLeague();
	const standingsBody = document.getElementById("standings-body");
	const fixtureList = document.getElementById("fixture-list");
	const matchForm = document.getElementById("match-form");
	const message = document.getElementById("league-message");
	const leagueNameHeading = document.getElementById("league-name");
	const leagueTeamCount = document.getElementById("league-team-count");
	const dashboardTeamCount = document.getElementById("dashboard-team-count");
	const dashboardFixtureCount = document.getElementById("dashboard-fixture-count");
	const dashboardEventCount = document.getElementById("dashboard-event-count");
	const dashboardAnnouncementCount = document.getElementById("dashboard-announcement-count");
	const leagueSettingsForm = document.getElementById("league-settings-form");
	const teamList = document.getElementById("team-list");
	const teamAddForm = document.getElementById("team-add-form");
	const eventForm = document.getElementById("event-form");
	const eventList = document.getElementById("event-list");
	const eventMessage = document.getElementById("event-message");
	const announcementForm = document.getElementById("announcement-form");
	const announcementList = document.getElementById("announcement-list");
	const announcementMessage = document.getElementById("announcement-message");

	function saveLeague() {
		try {
			localStorage.setItem(storageKey, JSON.stringify(league));
			return true;
		} catch (error) {
			console.warn("Could not save the league in this browser.", error);
			return false;
		}
	}

	function calculateStandings(teams, matches) {
		const rows = new Map(
			teams.map((team) => [
				team.id,
				{
					...team,
					played: 0,
					wins: 0,
					draws: 0,
					losses: 0,
					goalsFor: 0,
					goalsAgainst: 0,
					points: 0
				}
			])
		);

		for (const match of matches) {
			if (!Number.isInteger(match.homeScore) || !Number.isInteger(match.awayScore)) continue;

			const home = rows.get(match.homeTeamId);
			const away = rows.get(match.awayTeamId);
			if (!home || !away) continue;

			home.played++;
			away.played++;
			home.goalsFor += match.homeScore;
			home.goalsAgainst += match.awayScore;
			away.goalsFor += match.awayScore;
			away.goalsAgainst += match.homeScore;

			if (match.homeScore > match.awayScore) {
				home.wins++;
				away.losses++;
				home.points += 3;
			} else if (match.homeScore < match.awayScore) {
				away.wins++;
				home.losses++;
				away.points += 3;
			} else {
				home.draws++;
				away.draws++;
				home.points++;
				away.points++;
			}
		}

		return [...rows.values()].sort((a, b) => {
			const goalDifference = (team) => team.goalsFor - team.goalsAgainst;
			return (
				b.points - a.points ||
				goalDifference(b) - goalDifference(a) ||
				b.goalsFor - a.goalsFor ||
				a.name.localeCompare(b.name)
			);
		});
	}

	function addCell(row, value, className) {
		const cell = document.createElement("td");
		cell.textContent = value;
		if (className) cell.className = className;
		row.appendChild(cell);
	}

	function renderStandings() {
		standingsBody.replaceChildren();

		calculateStandings(league.teams, league.matches).forEach((team, index) => {
			const row = document.createElement("tr");
			const goalDifference = team.goalsFor - team.goalsAgainst;

			addCell(row, String(index + 1));
			addCell(row, team.name);
			addCell(row, String(team.played));
			addCell(row, String(team.wins));
			addCell(row, String(team.draws));
			addCell(row, String(team.losses));
			addCell(row, String(team.goalsFor));
			addCell(row, String(team.goalsAgainst));
			addCell(row, goalDifference > 0 ? `+${goalDifference}` : String(goalDifference));
			addCell(row, String(team.points));
			standingsBody.appendChild(row);
		});
	}

	function renderLeagueSettings() {
		leagueNameHeading.textContent = league.name;
		leagueTeamCount.textContent = `${league.teams.length} teams`;
		leagueSettingsForm.elements.leagueName.value = league.name;
		document.title = `${league.name} | LeagueUp`;
	}

	function renderDashboardStats() {
		dashboardTeamCount.textContent = String(league.teams.length);
		dashboardFixtureCount.textContent = String(league.matches.length);
		dashboardEventCount.textContent = String(league.events.length);
		dashboardAnnouncementCount.textContent = String(league.announcements.length);
	}

	function renderTeamEditor() {
		teamList.replaceChildren();

		for (const team of league.teams) {
			const item = document.createElement("li");
			item.className = "team-editor-item";

			const form = document.createElement("form");
			form.className = "team-edit-form";
			form.dataset.teamForm = team.id;

			const input = document.createElement("input");
			input.type = "text";
			input.name = "teamName";
			input.value = team.name;
			input.maxLength = 32;
			input.required = true;
			input.setAttribute("aria-label", `Team name for ${team.name}`);
			form.appendChild(input);

			const saveButton = document.createElement("button");
			saveButton.type = "submit";
			saveButton.textContent = "Save";
			form.appendChild(saveButton);
			item.appendChild(form);

			const removeButton = document.createElement("button");
			removeButton.type = "button";
			removeButton.dataset.removeTeam = team.id;
			removeButton.textContent = "Remove";
			removeButton.setAttribute("aria-label", `Remove ${team.name}`);
			item.appendChild(removeButton);
			teamList.appendChild(item);
		}
	}

	function createScoreField(name, matchId, teamName) {
		const label = document.createElement("label");
		label.className = "fixture-score-field";
		label.textContent = `${teamName} score`;

		const input = document.createElement("input");
		input.type = "number";
		input.name = name;
		input.min = "0";
		input.step = "1";
		input.required = true;
		input.setAttribute("aria-label", `${teamName} score for match ${matchId}`);
		label.appendChild(input);
		return label;
	}

	function renderFixtures() {
		fixtureList.replaceChildren();
		const teamNames = new Map(league.teams.map((team) => [team.id, team.name]));
		const sortedMatches = [...league.matches].sort((a, b) =>
			a.kickoffDate.localeCompare(b.kickoffDate)
		);

		for (const match of sortedMatches) {
			const homeName = teamNames.get(match.homeTeamId);
			const awayName = teamNames.get(match.awayTeamId);
			if (!homeName || !awayName) continue;

			const item = document.createElement("li");
			item.className = "fixture-item";

			const meta = document.createElement("div");
			meta.className = "fixture-meta";

			const date = document.createElement("time");
			date.dateTime = match.kickoffDate;
			date.textContent = new Date(`${match.kickoffDate}T12:00:00`).toLocaleDateString(
				undefined,
				{ weekday: "short", month: "short", day: "numeric" }
			);
			meta.appendChild(date);

			const state = document.createElement("span");
			state.className = "fixture-state";
			const isPlayed = Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore);
			state.textContent = isPlayed ? "Full time" : "Scheduled";
			meta.appendChild(state);
			item.appendChild(meta);

			const teams = document.createElement("p");
			teams.className = "fixture-teams";
			teams.textContent = `${homeName} v ${awayName}`;
			item.appendChild(teams);

			if (isPlayed) {
				const score = document.createElement("p");
				score.className = "fixture-final-score";
				score.textContent = `${match.homeScore} - ${match.awayScore}`;
				item.appendChild(score);
			} else {
				const form = document.createElement("form");
				form.className = "fixture-score-form";
				form.dataset.resultForm = match.id;
				form.appendChild(createScoreField("homeScore", match.id, homeName));
				form.appendChild(createScoreField("awayScore", match.id, awayName));

				const button = document.createElement("button");
				button.type = "submit";
				button.textContent = "Save result";
				form.appendChild(button);

				const resultDetails = document.createElement("details");
				resultDetails.className = "inline-disclosure";
				const resultSummary = document.createElement("summary");
				resultSummary.textContent = "Enter result";
				resultDetails.appendChild(resultSummary);
				resultDetails.appendChild(form);
				item.appendChild(resultDetails);
			}

			fixtureList.appendChild(item);
		}
	}

	function renderEvents() {
		eventList.replaceChildren();
		const sortedEvents = [...league.events].sort((a, b) => a.date.localeCompare(b.date));

		if (sortedEvents.length === 0) {
			const emptyItem = document.createElement("li");
			emptyItem.className = "community-empty";
			emptyItem.textContent = "No events yet. Add your first team event above.";
			eventList.appendChild(emptyItem);
			return;
		}

		for (const clubEvent of sortedEvents) {
			const item = document.createElement("li");
			item.className = "community-item";

			const header = document.createElement("div");
			header.className = "community-item-header";

			const title = document.createElement("h4");
			title.textContent = clubEvent.title;
			header.appendChild(title);

			const type = document.createElement("span");
			type.className = "event-type";
			type.textContent = clubEvent.type;
			header.appendChild(type);
			item.appendChild(header);

			const meta = document.createElement("div");
			meta.className = "community-item-meta";
			const eventDate = document.createElement("time");
			eventDate.dateTime = clubEvent.date;
			eventDate.textContent = new Date(`${clubEvent.date}T12:00:00`).toLocaleDateString(
				undefined,
				{ weekday: "short", month: "short", day: "numeric" }
			);
			meta.appendChild(eventDate);
			if (clubEvent.location) {
				const location = document.createElement("span");
				location.textContent = clubEvent.location;
				meta.appendChild(location);
			}
			item.appendChild(meta);

			const rsvps = Array.isArray(clubEvent.rsvps) ? clubEvent.rsvps : [];
			const going = rsvps.filter((rsvp) => rsvp.status === "going").length;
			const maybe = rsvps.filter((rsvp) => rsvp.status === "maybe").length;
			const notGoing = rsvps.filter((rsvp) => rsvp.status === "not-going").length;
			const counts = document.createElement("p");
			counts.className = "event-rsvp-counts";
			counts.textContent = `${going} going / ${maybe} maybe / ${notGoing} can't go`;
			item.appendChild(counts);

			if (rsvps.length > 0) {
				const rsvpList = document.createElement("ul");
				rsvpList.className = "rsvp-list";
				for (const rsvp of rsvps) {
					const response = document.createElement("li");
					const statusLabel = rsvp.status === "not-going" ? "can't go" : rsvp.status;
					response.textContent = `${rsvp.name}: ${statusLabel}`;
					rsvpList.appendChild(response);
				}
				const rosterDetails = document.createElement("details");
				rosterDetails.className = "inline-disclosure roster-disclosure";
				const rosterSummary = document.createElement("summary");
				rosterSummary.textContent = `See responses (${rsvps.length})`;
				rosterDetails.appendChild(rosterSummary);
				rosterDetails.appendChild(rsvpList);
				item.appendChild(rosterDetails);
			}

			const form = document.createElement("form");
			form.className = "rsvp-form";
			form.dataset.rsvpForm = clubEvent.id;

			const nameLabel = document.createElement("label");
			nameLabel.className = "schedule-field";
			const nameCaption = document.createElement("span");
			nameCaption.textContent = "Your name";
			nameLabel.appendChild(nameCaption);
			const nameInput = document.createElement("input");
			nameInput.name = "memberName";
			nameInput.type = "text";
			nameInput.maxLength = 40;
			nameInput.required = true;
			nameInput.setAttribute("aria-label", `Your name for ${clubEvent.title}`);
			nameLabel.appendChild(nameInput);
			form.appendChild(nameLabel);

			const statusLabel = document.createElement("label");
			statusLabel.className = "schedule-field";
			const statusCaption = document.createElement("span");
			statusCaption.textContent = "Response";
			statusLabel.appendChild(statusCaption);
			const statusSelect = document.createElement("select");
			statusSelect.name = "status";
			for (const [value, label] of [["going", "Going"], ["maybe", "Maybe"], ["not-going", "Can't go"]]) {
				const option = document.createElement("option");
				option.value = value;
				option.textContent = label;
				statusSelect.appendChild(option);
			}
			statusLabel.appendChild(statusSelect);
			form.appendChild(statusLabel);

			const button = document.createElement("button");
			button.type = "submit";
			button.textContent = "RSVP";
			form.appendChild(button);

			const rsvpDetails = document.createElement("details");
			rsvpDetails.className = "inline-disclosure";
			const rsvpSummary = document.createElement("summary");
			rsvpSummary.textContent = "Respond to event";
			rsvpDetails.appendChild(rsvpSummary);
			rsvpDetails.appendChild(form);
			item.appendChild(rsvpDetails);
			eventList.appendChild(item);
		}
	}

	function renderAnnouncements() {
		announcementList.replaceChildren();
		const sortedAnnouncements = [...league.announcements].sort((a, b) =>
			b.createdAt.localeCompare(a.createdAt)
		);

		if (sortedAnnouncements.length === 0) {
			const emptyItem = document.createElement("li");
			emptyItem.className = "community-empty";
			emptyItem.textContent = "No announcements yet.";
			announcementList.appendChild(emptyItem);
			return;
		}

		for (const announcement of sortedAnnouncements) {
			const item = document.createElement("li");
			item.className = "community-item";

			const header = document.createElement("div");
			header.className = "community-item-header";
			const title = document.createElement("h4");
			title.textContent = announcement.title;
			header.appendChild(title);
			const postedAt = document.createElement("time");
			postedAt.dateTime = announcement.createdAt;
			postedAt.className = "community-item-meta";
			postedAt.textContent = new Date(announcement.createdAt).toLocaleDateString(
				undefined,
				{ month: "short", day: "numeric" }
			);
			header.appendChild(postedAt);
			item.appendChild(header);

			const body = document.createElement("p");
			body.className = "announcement-copy";
			body.textContent = announcement.body;
			item.appendChild(body);
			announcementList.appendChild(item);
		}
	}

	function renderTeamOptions() {
		for (const select of matchForm.querySelectorAll("select")) {
			select.replaceChildren();
			for (const team of league.teams) {
				const option = document.createElement("option");
				option.value = team.id;
				option.textContent = team.name;
				select.appendChild(option);
			}
		}
	}

	function refreshLeague() {
		renderLeagueSettings();
		renderDashboardStats();
		renderTeamEditor();
		renderTeamOptions();
		renderStandings();
		renderFixtures();
		renderEvents();
		renderAnnouncements();
	}

	function hasDuplicateTeamName(name, exceptTeamId) {
		return league.teams.some(
			(team) => team.id !== exceptTeamId && team.name.toLocaleLowerCase() === name.toLocaleLowerCase()
		);
	}

	function createTeamId(name) {
		const baseId = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
		let teamId = baseId;
		let suffix = 2;
		while (league.teams.some((team) => team.id === teamId)) {
			teamId = `${baseId}-${suffix++}`;
		}
		return teamId;
	}

	leagueSettingsForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(leagueSettingsForm);
		const name = formData.get("leagueName").trim();
		if (!name) {
			message.textContent = "Enter a league name.";
			return;
		}

		league.name = name;
		const saved = saveLeague();
		refreshLeague();
		message.textContent = saved ? "League name saved." : "League name updated for this session, but browser storage failed.";
	});

	teamList.addEventListener("submit", (event) => {
		const form = event.target.closest("[data-team-form]");
		if (!form) return;
		event.preventDefault();

		const team = league.teams.find((item) => item.id === form.dataset.teamForm);
		const name = new FormData(form).get("teamName").trim();
		if (!team || !name) return;
		if (hasDuplicateTeamName(name, team.id)) {
			message.textContent = "Each team needs a different name.";
			return;
		}

		team.name = name;
		const saved = saveLeague();
		refreshLeague();
		message.textContent = saved ? "Team name updated." : "Team name updated for this session, but browser storage failed.";
	});

	teamList.addEventListener("click", (event) => {
		const button = event.target.closest("[data-remove-team]");
		if (!button) return;

		if (league.teams.length <= 2) {
			message.textContent = "A league needs at least two teams.";
			return;
		}

		const team = league.teams.find((item) => item.id === button.dataset.removeTeam);
		if (!team) return;
		const relatedMatches = league.matches.filter(
			(match) => match.homeTeamId === team.id || match.awayTeamId === team.id
		);
		const warning = `Remove ${team.name} and its ${relatedMatches.length} fixture(s) and result(s)? This cannot be undone.`;
		if (!window.confirm(warning)) return;

		league.teams = league.teams.filter((item) => item.id !== team.id);
		league.matches = league.matches.filter(
			(match) => match.homeTeamId !== team.id && match.awayTeamId !== team.id
		);
		const saved = saveLeague();
		refreshLeague();
		message.textContent = saved ? `${team.name} and its fixtures were removed.` : "Team removed for this session, but browser storage failed.";
	});

	teamAddForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const name = new FormData(teamAddForm).get("teamName").trim();
		if (!name) return;
		if (hasDuplicateTeamName(name)) {
			message.textContent = "Each team needs a different name.";
			return;
		}

		league.teams.push({ id: createTeamId(name), name });
		const saved = saveLeague();
		teamAddForm.reset();
		refreshLeague();
		message.textContent = saved ? `${name} added to the league.` : `${name} added for this session, but browser storage failed.`;
	});

	matchForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(matchForm);
		const homeTeamId = formData.get("homeTeam");
		const awayTeamId = formData.get("awayTeam");

		if (homeTeamId === awayTeamId) {
			message.textContent = "Choose two different teams for a fixture.";
			return;
		}

		league.matches.push({
			id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			homeTeamId,
			awayTeamId,
			kickoffDate: formData.get("kickoffDate"),
			homeScore: null,
			awayScore: null
		});

		const saved = saveLeague();
		renderFixtures();
		renderDashboardStats();
		const scheduleDisclosure = matchForm.closest("details");
		if (scheduleDisclosure) scheduleDisclosure.open = false;
		message.textContent = saved
			? "Fixture added and saved in this browser."
			: "Fixture added for this session, but browser storage failed.";
		matchForm.reset();
	});

	eventForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(eventForm);
		const title = formData.get("title").trim();
		const date = formData.get("date");
		if (!title || !date) return;

		league.events.push({
			id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			title,
			type: formData.get("type"),
			date,
			location: formData.get("location").trim(),
			rsvps: []
		});

		const saved = saveLeague();
		eventForm.reset();
		renderEvents();
		renderDashboardStats();
		const eventDisclosure = eventForm.closest("details");
		if (eventDisclosure) eventDisclosure.open = false;
		eventMessage.textContent = saved
			? "Event added."
			: "Event added for this session, but browser storage failed.";
	});

	eventList.addEventListener("submit", (event) => {
		const form = event.target.closest("[data-rsvp-form]");
		if (!form) return;
		event.preventDefault();

		const clubEvent = league.events.find((item) => item.id === form.dataset.rsvpForm);
		const formData = new FormData(form);
		const name = formData.get("memberName").trim();
		if (!clubEvent || !name) return;

		const existingResponse = clubEvent.rsvps.find(
			(rsvp) => rsvp.name.toLocaleLowerCase() === name.toLocaleLowerCase()
		);
		if (existingResponse) {
			existingResponse.status = formData.get("status");
		} else {
			clubEvent.rsvps.push({ name, status: formData.get("status") });
		}

		const saved = saveLeague();
		renderEvents();
		eventMessage.textContent = saved
			? `RSVP saved for ${name}.`
			: "RSVP updated for this session, but browser storage failed.";
	});

	announcementForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(announcementForm);
		const title = formData.get("title").trim();
		const body = formData.get("body").trim();
		if (!title || !body) return;

		league.announcements.unshift({
			id: `announcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			title,
			body,
			createdAt: new Date().toISOString()
		});

		const saved = saveLeague();
		announcementForm.reset();
		renderAnnouncements();
		renderDashboardStats();
		const announcementDisclosure = announcementForm.closest("details");
		if (announcementDisclosure) announcementDisclosure.open = false;
		announcementMessage.textContent = saved
			? "Announcement posted."
			: "Announcement posted for this session, but browser storage failed.";
	});

	fixtureList.addEventListener("submit", (event) => {
		const form = event.target.closest("[data-result-form]");
		if (!form) return;
		event.preventDefault();

		const formData = new FormData(form);
		const homeScore = Number(formData.get("homeScore"));
		const awayScore = Number(formData.get("awayScore"));
		if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
			message.textContent = "Enter a whole number of zero or more for each score.";
			return;
		}

		const match = league.matches.find((item) => item.id === form.dataset.resultForm);
		if (!match) return;
		match.homeScore = homeScore;
		match.awayScore = awayScore;

		const saved = saveLeague();
		renderStandings();
		renderFixtures();
		message.textContent = saved
			? "Result saved. The table has been recalculated."
			: "Result updated for this session, but browser storage failed.";
	});

	refreshLeague();
})();