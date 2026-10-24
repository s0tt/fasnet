/**
 * Fasnet 2027 Salmendingen – Narrenfahrplan Logic
 * Handles dynamic countdown, category filtering, and .ics calendar exports
 */

(function () {
  'use strict';

  var events = [
    {
      id: 'kampagnenstart',
      title: 'Fasnetsbeginn',
      category: 'tradition',
      badge: 'Tradition',
      badgeClass: 'badge-tradition',
      featured: false,
      weekday: 'Mittwoch',
      day: '11',
      month: 'Nov 2026',
      startDate: new Date('2026-11-11T11:11:00'),
      endDate: new Date('2026-11-11T18:00:00'),
      time: '11:11 Uhr',
      location: 'Dorfplatz / Vereinsheim Salmendingen',
      desc: 'Offizieller Fasnetsbeginn am 11.11. um 11:11 Uhr mit dem Elferrat Salmendingen.',
      subPoints: ['Fasnetsbeginn um 11:11 Uhr', 'Treff des Elferrats']
    },
    {
      id: 'narrenbaumstellen',
      title: 'Narrenbaumstellen & Narrenversammlung',
      category: 'tradition',
      badge: 'Tradition',
      badgeClass: 'badge-tradition',
      featured: true,
      weekday: 'Samstag',
      day: '09',
      month: 'Jan 2027',
      startDate: new Date('2027-01-09T18:00:00'),
      endDate: new Date('2027-01-09T23:59:00'),
      time: '18:00 Uhr',
      location: 'Dorfplatz & Gasthaus Lamm',
      desc: 'Feierliches Aufstellen des Salmendinger Narrenbaums am Dorfplatz, anschließend gesellige Narrenversammlung.',
      subPoints: ['18:00 Uhr Narrenbaumstellen am Dorfplatz', 'Danach Narrenversammlung im Lamm']
    },
    {
      id: 'sportheim',
      title: 'Sportheim Fasnet',
      category: 'party',
      badge: 'Party',
      badgeClass: 'badge-party',
      featured: false,
      weekday: 'Freitag',
      day: '29',
      month: 'Jan 2027',
      startDate: new Date('2027-01-29T20:00:00'),
      endDate: new Date('2027-01-30T03:00:00'),
      time: '20:00 Uhr',
      location: 'Sportheim Salmendingen',
      desc: 'Die legendäre Sportheim-Fasnet zur Einstimmung auf die heiße Phase! Feiern bis in die Morgenstunden.',
      subPoints: ['Motto: Wird zeitnah bekanntgegeben', 'Beste Fasnetsmusik & Barbetrieb']
    },
    {
      id: 'rathaussturm',
      title: 'Schmotziger Doschdich – Rathaussturm',
      category: 'hauptfasnet',
      badge: 'Highlight',
      badgeClass: 'badge-highlight',
      featured: true,
      weekday: 'Donnerstag',
      day: '04',
      month: 'Feb 2027',
      startDate: new Date('2027-02-04T15:00:00'),
      endDate: new Date('2027-02-04T23:59:00'),
      time: '15:00 Uhr',
      location: 'Rathaus Salmendingen',
      desc: 'Sturm auf das Rathaus, Entmachtung des Ortsvorstehers und Schlüsselübergabe an die Narren.',
      subPoints: ['15:00 Uhr Rathaussturm', 'Motto: Salmendingen durch Raum & Zeit – Fasnet für jede Epoche', 'Anschließend Narrentreiben im Ort']
    },
    {
      id: 'clubfasnet',
      title: 'Clubfasnet im Jugendclub',
      category: 'party',
      badge: 'Party',
      badgeClass: 'badge-party',
      featured: false,
      weekday: 'Freitag',
      day: '05',
      month: 'Feb 2027',
      startDate: new Date('2027-02-05T20:00:00'),
      endDate: new Date('2027-02-06T04:00:00'),
      time: '20:00 Uhr',
      location: 'Jugendclub Salmendingen',
      desc: 'Ausgelassene Stimmung bei der Clubfasnet. Motto passend zum Rathaussturm.',
      subPoints: ['20:00 Uhr Einlass', 'DJ & Barbetrieb']
    },
    {
      id: 'erbseneintopf',
      title: 'Erbseneintopf-Verkauf',
      category: 'kulinarisch',
      badge: 'Kulinarisch',
      badgeClass: 'badge-free',
      featured: false,
      weekday: 'Samstag',
      day: '06',
      month: 'Feb 2027',
      startDate: new Date('2027-02-06T11:00:00'),
      endDate: new Date('2027-02-06T14:00:00'),
      time: '11:00 Uhr',
      location: 'Vor dem DRK-Haus (Feuerwehr)',
      desc: 'Traditioneller Erbseneintopf-Verkauf für das leibliche Wohl. Solange der Vorrat reicht!',
      subPoints: ['Verkauf vor dem DRK-Haus (Feuerwehr)', 'Frisch zubereitet nach Traditionsrezept']
    },
    {
      id: 'kinderfasnet',
      title: 'Große Kinderfasnet',
      category: 'kinder',
      badge: 'Eintritt frei',
      badgeClass: 'badge-free',
      featured: false,
      weekday: 'Sonntag',
      day: '07',
      month: 'Feb 2027',
      startDate: new Date('2027-02-07T13:30:00'),
      endDate: new Date('2027-02-07T17:30:00'),
      time: '13:30 Uhr',
      location: 'Melchinger Halle',
      desc: 'Ein buntes Programm für Groß und Klein mit Spielen, Tanz und viel Spaß.',
      subPoints: ['Buntes Programm von Kindergarten und Pfadfindern', 'Auftritt der Prinzengarden', 'Eintritt: Frei']
    },
    {
      id: 'fackelumzug',
      title: 'Fackelumzug & Kappenabend',
      category: 'hauptfasnet',
      badge: 'Highlight',
      badgeClass: 'badge-highlight',
      featured: true,
      weekday: 'Sonntag',
      day: '07',
      month: 'Feb 2027',
      startDate: new Date('2027-02-07T18:00:00'),
      endDate: new Date('2027-02-08T02:00:00'),
      time: '18:00 Uhr',
      location: 'Rund um\'s Rathaus & Feuerwehrhaus',
      desc: 'Stimmungsvoller Fackelumzug durch die Salmendinger Straßen mit anschließendem bunten Kappenabend.',
      subPoints: [
        '18:00 Uhr Fackelumzug am Rathaus',
        'Danach Fasnet rund um\'s Rathaus (Feuerwehrhaus, Jugendclub, Motorradfreunde)',
        'Programm des Elferrats & Musik mit Luka',
        'Kappenabend mit Prämierung im Feuerwehrhaus'
      ]
    },
    {
      id: 'rosenmontag',
      title: 'Großer Rosenmontag in Salmendingen',
      category: 'hauptfasnet',
      badge: 'Großer Umzug',
      badgeClass: 'badge-highlight',
      featured: true,
      weekday: 'Rosenmontag',
      day: '08',
      month: 'Feb 2027',
      startDate: new Date('2027-02-08T08:30:00'),
      endDate: new Date('2027-02-09T03:00:00'),
      time: 'Ab 08:30 Uhr',
      location: 'Ortsmitte & Feuerwehrhaus Salmendingen',
      desc: 'Der absolute Höhepunkt der Salmendinger Fasnet mit Riesenbrezeln, Habersammeln und dem großen Festumzug!',
      subPoints: [
        '08:30 Uhr Verkauf Riesenbrezeln (Sportverein)',
        '09:00 Uhr Habersammeln des Elferrats',
        '11:00 Uhr Gulaschsuppe im Feuerwehrhaus',
        '14:00 Uhr GROSSER ROSENMONTAGSUMZUG mit Prämierung von Wagen & Maskengruppen',
        '19:00 Uhr Straßenfasnet rund um\'s Rathaus (FW-Haus, Club, Motorradfreunde)'
      ]
    },
    {
      id: 'jahrmarkt',
      title: 'Fasnetsdienstag: Großer Jahrmarkt',
      category: 'tradition',
      badge: 'Tradition',
      badgeClass: 'badge-tradition',
      featured: false,
      weekday: 'Dienstag',
      day: '09',
      month: 'Feb 2027',
      startDate: new Date('2027-02-09T14:00:00'),
      endDate: new Date('2027-02-09T20:00:00'),
      time: '14:00 Uhr',
      location: 'Dorfplatz Salmendingen',
      desc: 'Bunter Jahrmarkt zum Abschluss der Kampagne mit vielen Spielen, Marktständen und Attraktionen. Jeder darf mitmachen!',
      subPoints: ['14:00 Uhr Start Jahrmarkt', 'Attraktionen für Alt & Jung', 'Fasnetsausklang']
    }
  ];

  // Render Event Cards
  function renderEvents(filterCategory) {
    var container = document.getElementById('events-container');
    if (!container) return;

    var filtered = events;
    if (filterCategory && filterCategory !== 'all') {
      filtered = events.filter(function (e) {
        if (filterCategory === 'umzug') {
          return e.id === 'fackelumzug' || e.id === 'rosenmontag';
        }
        return e.category === filterCategory;
      });
    }

    container.innerHTML = filtered.map(function (ev) {
      var cardClass = 'event-card' + (ev.featured ? ' featured' : '') + (ev.category === 'hauptfasnet' ? ' highlight' : '');
      var subListHtml = ev.subPoints && ev.subPoints.length > 0
        ? '<ul class="event-sub-points">' + ev.subPoints.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'
        : '';

      return (
        '<article class="' + cardClass + '" data-id="' + ev.id + '">' +
          '<div class="event-date-box">' +
            '<span class="event-weekday">' + ev.weekday + '</span>' +
            '<span class="event-day">' + ev.day + '</span>' +
            '<span class="event-month">' + ev.month + '</span>' +
          '</div>' +
          '<div class="event-details">' +
            '<div class="event-meta-row">' +
              '<span class="event-time">⏰ ' + ev.time + '</span>' +
              '<span class="event-location">📍 ' + ev.location + '</span>' +
              '<span class="badge-tag ' + ev.badgeClass + '">' + ev.badge + '</span>' +
            '</div>' +
            '<h3 class="event-title">' + ev.title + '</h3>' +
            '<p class="event-desc">' + ev.desc + '</p>' +
            subListHtml +
          '</div>' +
          '<div class="event-actions">' +
            '<button class="btn-cal-add" onclick="window.fasnetCalendar.exportSingle(\'' + ev.id + '\')">' +
              '📅 In Kalender' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  // Live Countdown logic
  function setupCountdown() {
    var daysEl = document.getElementById('countdown-days');
    var hoursEl = document.getElementById('countdown-hours');
    var minsEl = document.getElementById('countdown-mins');
    var secsEl = document.getElementById('countdown-secs');
    var eventNameEl = document.getElementById('countdown-event-name');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    // Find next upcoming event
    var now = new Date();
    var nextEvent = events.find(function (e) {
      return e.startDate > now;
    });

    if (!nextEvent) {
      // If all passed, target next season
      nextEvent = events[0];
    }

    if (eventNameEl) {
      eventNameEl.textContent = nextEvent.title + ' (' + nextEvent.day + '.' + (nextEvent.startDate.getMonth() + 1) + '.)';
    }

    function update() {
      var current = new Date();
      var diff = nextEvent.startDate - current;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = d < 10 ? '0' + d : d;
      hoursEl.textContent = h < 10 ? '0' + h : h;
      minsEl.textContent = m < 10 ? '0' + m : m;
      secsEl.textContent = s < 10 ? '0' + s : s;
    }

    update();
    setInterval(update, 1000);
  }

  // Filter Buttons
  function setupFilters() {
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        renderEvents(cat);
      });
    });
  }

  // iCalendar (.ics) Generator
  function formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function generateICSContent(eventList) {
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Elferrat Salmendingen//Fasnet 2027//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Fasnet 2027 Salmendingen',
      'X-WR-TIMEZONE:Europe/Berlin'
    ];

    eventList.forEach(function (ev) {
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + ev.id + '-2027@fasnet-salmendingen.de');
      lines.push('DTSTAMP:' + formatICSDate(new Date()));
      lines.push('DTSTART:' + formatICSDate(ev.startDate));
      lines.push('DTEND:' + formatICSDate(ev.endDate));
      lines.push('SUMMARY:' + ev.title + ' – Fasnet Salmendingen');
      lines.push('DESCRIPTION:' + ev.desc.replace(/,/g, '\\,'));
      lines.push('LOCATION:' + ev.location.replace(/,/g, '\\,'));
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadFile(filename, content) {
    var blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calendar Export API
  window.fasnetCalendar = {
    exportSingle: function (eventId) {
      var ev = events.find(function (e) { return e.id === eventId; });
      if (!ev) return;
      var ics = generateICSContent([ev]);
      downloadFile(ev.id + '_salmendingen_2027.ics', ics);
    },
    exportAll: function () {
      var ics = generateICSContent(events);
      downloadFile('Fasnet_2027_Salmendingen_Alle_Termine.ics', ics);
    }
  };

  // Mobile Menu Toggle
  function setupMobileMenu() {
    var toggle = document.querySelector('.mobile-nav-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
      });
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function () {
    renderEvents('all');
    setupCountdown();
    setupFilters();
    setupMobileMenu();

    var exportAllBtn = document.getElementById('export-all-ics-btn');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.fasnetCalendar.exportAll();
      });
    }
  });
})();
