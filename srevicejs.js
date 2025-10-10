let allTickets = {
  flight: JSON.parse(localStorage.getItem("tickets_flight")) || [],
  bike: JSON.parse(localStorage.getItem("tickets_bike")) || [],
  car: JSON.parse(localStorage.getItem("tickets_car")) || [],
  bicycle: JSON.parse(localStorage.getItem("tickets_bicycle")) || []
};

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('active');
}

function updateCounters() {
  document.getElementById('flight-counter').textContent = `🎟️ Tickets Booked: ${allTickets.flight.reduce((s, t) => s + t.units, 0)}`;
  document.getElementById('bike-counter').textContent = `💡 Hours Booked: ${allTickets.bike.reduce((s, t) => s + t.units, 0)}`;
  document.getElementById('car-counter').textContent = `⏰ Hours Booked: ${allTickets.car.reduce((s, t) => s + t.units, 0)}`;
  document.getElementById('bicycle-counter').textContent = `⏰ Hours Booked: ${allTickets.bicycle.reduce((s, t) => s + t.units, 0)}`;
  
  document.getElementById('show-tickets-flight').style.display = allTickets.flight.length ? "inline-block" : "none";
  document.getElementById('show-tickets-bike').style.display = allTickets.bike.length ? "inline-block" : "none";
  document.getElementById('show-tickets-car').style.display = allTickets.car.length ? "inline-block" : "none";
  document.getElementById('show-tickets-bicycle').style.display = allTickets.bicycle.length ? "inline-block" : "none";
}
updateCounters();

document.querySelectorAll('#services .service-card').forEach(card => {
  card.addEventListener('click', () => {
    const target = card.dataset.target;
    if (target) {
      document.querySelectorAll('.details-section').forEach(sec => sec.style.display = "none");
      document.getElementById(target).style.display = "block";
      document.getElementById(target).scrollIntoView({ behavior: "smooth" });
    }
  });
});

let lastTicketObj = { flight: {}, bike: {}, car: {}, bicycle: {} };

document.querySelectorAll('.details-section .service-card').forEach(card => {
  const serviceType = card.dataset.service;
  const rate = parseFloat(card.dataset.rate || 0);
  const calcBtn = card.querySelector('.calc-btn');
  const bookBtn = card.querySelector('.book-btn');
  const costText = card.querySelector('.cost-text');
  const input = card.querySelector('input');
  const selectAirline = card.querySelector('select'); // Only flights will have this

  let formCard = document.getElementById(`user-form-${serviceType}`);
  let ticketIdElem = document.getElementById(`ticket-id-${serviceType}`);

  calcBtn.addEventListener('click', () => {
    const value = parseInt(input.value);
    if (!value || value <= 0) { alert("Enter valid number"); return; }
    const cost = value * rate;
    costText.textContent = `💰 ₹${cost} for ${value} ${serviceType === "flight" ? "tickets" : "hours"} (${card.dataset.class})`;
    const ticketId = "TCKT" + Math.floor(100000 + Math.random() * 900000);
    ticketIdElem.textContent = `🎫 Ticket ID: ${ticketId}`;

    if (serviceType === "flight") {
      formCard.innerHTML = "";
      for (let i = 1; i <= value; i++) {
        formCard.innerHTML += `
          <div style="border:1px solid #00deab;padding:8px;margin:8px 0;border-radius:8px">
            <p><b>Passenger ${i}</b></p>
            <input type="text" id="user-name-${serviceType}-${i}" placeholder="Name" required><br>
            <input type="email" id="user-email-${serviceType}-${i}" placeholder="Email" required><br>
            <input type="tel" id="user-phone-${serviceType}-${i}" placeholder="Phone" required><br>
          </div>`;
      }
      formCard.innerHTML += `<button onclick="submitDetails('${serviceType}',${value})">Submit Passenger Details</button>`;
      formCard.style.display = "block";
    } else {
      formCard.style.display = "block";
      formCard.scrollIntoView({ behavior: "smooth" });
    }

    lastTicketObj[serviceType] = {
      id: ticketId,
      units: value,
      class: card.dataset.class,
      cost: cost,
      airline: serviceType === "flight" ? (selectAirline ? selectAirline.value : "") : "",
      bookBtn: bookBtn
    };
  });

  bookBtn.addEventListener('click', () => {
    alert(`✅ Booking Confirmed!\nType: ${lastTicketObj[serviceType].class}\n${serviceType === "flight" ? "Tickets" : "Hours"}: ${lastTicketObj[serviceType].units}${serviceType === "flight" ? `\nAirline: ${lastTicketObj[serviceType].airline || 'N/A'}` : ""}\nTotal Cost: ₹${lastTicketObj[serviceType].cost}`);
    allTickets[serviceType].push({ ...lastTicketObj[serviceType] });
    localStorage.setItem("tickets_" + serviceType, JSON.stringify(allTickets[serviceType]));
    updateCounters();
  });
});

function submitDetails(type, count = 1) {
  if (type === "flight") {
    lastTicketObj[type].passengers = [];
    for (let i = 1; i <= count; i++) {
      let name = document.getElementById(`user-name-${type}-${i}`).value;
      let email = document.getElementById(`user-email-${type}-${i}`).value;
      let phone = document.getElementById(`user-phone-${type}-${i}`).value;
      if (!name || !email || !phone) { alert(`⚠️ Fill all fields for Passenger ${i}`); return; }
      lastTicketObj[type].passengers.push({ name, email, phone });
    }
    alert("✅ Passenger Details Submitted!");
    document.getElementById(`user-form-${type}`).style.display = "none";
    if (lastTicketObj[type].bookBtn) { lastTicketObj[type].bookBtn.style.display = "inline-block"; lastTicketObj[type].bookBtn.scrollIntoView({ behavior: "smooth" }); }
  } else {
    let name = document.getElementById(`user-name-${type}`).value;
    let email = document.getElementById(`user-email-${type}`).value;
    let phone = document.getElementById(`user-phone-${type}`).value;
    if (!name || !email || !phone) { alert("⚠️ Fill all fields."); return; }
    alert("✅ Details Submitted!");
    document.getElementById(`user-form-${type}`).style.display = "none";
    lastTicketObj[type].name = name; lastTicketObj[type].email = email; lastTicketObj[type].phone = phone;
    if (lastTicketObj[type].bookBtn) { lastTicketObj[type].bookBtn.style.display = "inline-block"; lastTicketObj[type].bookBtn.scrollIntoView({ behavior: "smooth" }); }
  }
}

function deleteTicket(ticketId, type) {
  const idx = allTickets[type].findIndex(t => t.id === ticketId);
  if (idx !== -1) { 
    allTickets[type].splice(idx, 1); 
    localStorage.setItem("tickets_" + type, JSON.stringify(allTickets[type])); 
    updateCounters(); 
    renderTickets(type); 
  }
}

function renderTickets(type) {
  let ticketsList = document.getElementById(`tickets-list-${type}`);
  ticketsList.innerHTML = "";
  allTickets[type].forEach((t, index) => {
    ticketsList.innerHTML += `<div style="border:1px solid #00deab;border-radius:8px;padding:8px;margin:8px 0;text-align:left">
      <p><b>#${index + 1}</b></p>
      <p>🎫 Ticket ID: ${t.id}</p>
      <p>Type: ${t.class}</p>
      ${type === "flight" ? `<p>Airline: ${t.airline || 'N/A'}</p>` : ""}
      ${type === "flight" && t.passengers ? t.passengers.map((p,i)=>`<p>👤 Passenger ${i+1}: ${p.name}, ${p.email}, ${p.phone}</p>`).join("") : `
        <p>👤 Name: ${t.name || 'N/A'}</p>
        <p>📧 Email: ${t.email || 'N/A'}</p>
        <p>📞 Phone: ${t.phone || 'N/A'}</p>
      `}
      <p>${type === "flight" ? "🎟️ Tickets" : "⏰ Hours"}: ${t.units}</p>
      <p>💰 Cost: ₹${t.cost}</p>
      <button class="delete-btn" onclick="deleteTicket('${t.id}','${type}')">❌ Cancel ${type === "flight" ? "Ticket" : "Rental"}</button>
    </div>`;
  });
  document.getElementById(`ticket-summary-${type}`).style.display = allTickets[type].length ? "block" : "none";
}

document.getElementById('show-tickets-flight').addEventListener('click', () => { 
  if (!allTickets.flight.length) return; 
  renderTickets('flight'); 
  document.getElementById('ticket-summary-flight').scrollIntoView({ behavior: "smooth" }); 
});

document.getElementById('show-tickets-bike').addEventListener('click', () => { 
  if (!allTickets.bike.length) return; 
  renderTickets('bike'); 
  document.getElementById('ticket-summary-bike').scrollIntoView({ behavior: "smooth" }); 
});

document.getElementById('show-tickets-car').addEventListener('click', () => { 
  if (!allTickets.car.length) return; 
  renderTickets('car'); 
  document.getElementById('ticket-summary-car').scrollIntoView({ behavior: "smooth" }); 
});

document.getElementById('show-tickets-bicycle').addEventListener('click', () => { 
  if (!allTickets.bicycle.length) return; 
  renderTickets('bicycle'); 
  document.getElementById('ticket-summary-bicycle').scrollIntoView({ behavior: "smooth" }); 
});
