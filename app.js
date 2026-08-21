/* ============================================================
   Дело · общие взаимодействия
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Утилиты ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ---------- Toast ---------- */
  function toast(message, type) {
    type = type || "info";
    var wrap = $(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    var icons = {
      info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      success: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
    };
    var el = document.createElement("div");
    el.className = "toast " + type;
    el.setAttribute("role", "status");
    el.innerHTML = (icons[type] || icons.info) + "<span></span>";
    el.querySelector("span").textContent = message;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s";
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  /* ---------- Боковая панель (мобильная) ---------- */
  function initSidebar() {
    var toggle = $(".menu-toggle");
    var sidebar = $("#sidebar");
    var backdrop = $(".sidebar-backdrop");
    if (!toggle || !sidebar) return;
    function close() {
      sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    function open() {
      sidebar.classList.add("open");
      if (backdrop) backdrop.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }
    toggle.addEventListener("click", function () {
      sidebar.classList.contains("open") ? close() : open();
    });
    if (backdrop) backdrop.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- Модальное окно (новый документ) ---------- */
  function initModal() {
    var triggers = $$("[data-modal-open]");
    var overlay = $("#modal-overlay");
    if (!overlay) return;
    var closeBtn = overlay.querySelector("[data-modal-close]");

    function openModal(name) {
      var titleEl = overlay.querySelector("[data-modal-title]");
      if (name && titleEl) titleEl.textContent = name;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      var first = overlay.querySelector("input, select, textarea, button");
      if (first) setTimeout(function () { first.focus(); }, 30);
    }
    function closeModal() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      var opener = document.querySelector("[data-modal-open]");
      if (opener) opener.focus();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-modal-open"));
      });
    });
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    /* Сабмит формы нового документа (демо) */
    var form = overlay.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = form.querySelector("input") ? form.querySelector("input").value.trim() : "";
        closeModal();
        toast(name ? "Документ «" + name + "» создан" : "Документ создан", "success");
      });
    }
  }

  /* ---------- Копирование в буфер ---------- */
  function initCopy() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            toast("Ссылка скопирована", "success");
          }).catch(function () { fallbackCopy(text); });
        } else {
          fallbackCopy(text);
        }
      });
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("Ссылка скопирована", "success"); }
    catch (e) { toast("Не удалось скопировать", "info"); }
    ta.remove();
  }

  /* ---------- Фильтры-чипы ---------- */
  function initChips() {
    var group = $("[data-chip-group]");
    if (!group) return;
    var chips = $$(".chip", group);
    var rows = $$("[data-filter]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
        var f = chip.getAttribute("data-filter-value");
        var count = 0;
        rows.forEach(function (row) {
          var match = f === "all" || row.getAttribute("data-filter") === f;
          row.style.display = match ? "" : "none";
          if (match) count++;
        });
        updateEmpty(count);
      });
    });
  }
  function updateEmpty(count) {
    var empty = $("#empty-state");
    var list = $("#doc-list");
    if (!empty || !list) return;
    empty.style.display = count === 0 ? "" : "none";
  }

  /* ---------- Переключение вида (список/сетка) ---------- */
  function initViewToggle() {
    var btns = $$("[data-view]");
    var list = $("#doc-list");
    var grid = $("#doc-grid");
    if (!list || !grid) return;
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var view = btn.getAttribute("data-view");
        btns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        if (view === "grid") {
          list.style.display = "none";
          grid.style.display = "";
        } else {
          list.style.display = "";
          grid.style.display = "none";
        }
      });
    });
  }

  /* ---------- Демо-состояния (загрузка/пусто/ошибка) ---------- */
  function initDemoStates() {
    var demos = $$("[data-demo-state]");
    demos.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var state = btn.getAttribute("data-demo-state");
        showState(state);
      });
    });
  }
  function showState(state) {
    var list = $("#doc-list");
    var grid = $("#doc-grid");
    var loading = $("#loading-state");
    var empty = $("#empty-state");
    var error = $("#error-state");
    if (!list) return;
    list.style.display = state === "populated" ? "" : "none";
    if (grid) grid.style.display = "none";
    if (loading) loading.style.display = state === "loading" ? "" : "none";
    if (empty) empty.style.display = state === "empty" ? "" : "none";
    if (error) error.style.display = state === "error" ? "" : "none";
    if (state === "loading") {
      setTimeout(function () {
        if (loading && loading.style.display !== "none") {
          showState("populated");
          toast("Данные загружены", "success");
        }
      }, 1800);
    }
  }

  /* ---------- Валидация форм ---------- */
  function initForms() {
    $$("form[data-validate]").forEach(function (form) {
      var submit = form.querySelector("button[type='submit']");
      form.addEventListener("submit", function (e) {
        var valid = true;
        $$(".field", form).forEach(function (field) {
          var input = field.querySelector("input, select, textarea");
          if (!input) return;
          var ok = input.checkValidity();
          if (!ok) {
            field.classList.add("has-error");
            valid = false;
          } else {
            field.classList.remove("has-error");
          }
        });
        if (!valid) {
          e.preventDefault();
          var firstBad = form.querySelector(".field.has-error input, .field.has-error select, .field.has-error textarea");
          if (firstBad) firstBad.focus();
          return;
        }
        e.preventDefault();
        if (submit) {
          submit.disabled = true;
          submit.setAttribute("aria-busy", "true");
          submit.textContent = "Сохранение…";
        }
        setTimeout(function () {
          if (submit) {
            submit.disabled = false;
            submit.removeAttribute("aria-busy");
            submit.textContent = submit.getAttribute("data-default") || "Сохранить";
          }
          toast("Сохранено", "success");
        }, 900);
      });
      /* Сброс ошибки при вводе */
      $$(".field input, .field select, .field textarea", form).forEach(function (input) {
        input.addEventListener("input", function () {
          var field = input.closest(".field");
          if (field && input.checkValidity()) field.classList.remove("has-error");
        });
      });
    });
  }

  /* ---------- Редактор ---------- */
  function initEditor() {
    var prose = $(".prose");
    var status = $("#save-status");
    if (!prose) return;
    var timer;
    prose.addEventListener("input", function () {
      if (status) {
        status.className = "save-status";
        status.querySelector("span").textContent = "Несохранённые изменения…";
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (status) {
          status.className = "save-status saved";
          status.querySelector("span").textContent = "Сохранено";
        }
      }, 1200);
    });
    /* Подсчёт слов */
    var counter = $("#word-count");
    if (counter) {
      prose.addEventListener("input", function () {
        var t = prose.innerText.trim();
        var n = t ? t.split(/\s+/).length : 0;
        counter.textContent = n + " слов · " + t.length + " символов";
      });
    }
    /* Кнопки панели инструментов (демо) */
    $$("[data-format]", document).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fmt = btn.getAttribute("data-format");
        if (fmt === "bold" || fmt === "italic" || fmt === "underline" || fmt === "list" || fmt === "align-left" || fmt === "align-center") {
          btn.classList.toggle("active");
          toast("Форматирование применено (демо)", "info");
        } else {
          toast("Действие «" + fmt + "» (демо)", "info");
        }
      });
    });
  }

  /* ---------- Инициализация ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initSidebar();
    initModal();
    initCopy();
    initChips();
    initViewToggle();
    initDemoStates();
    initForms();
    initEditor();
  });
})();
