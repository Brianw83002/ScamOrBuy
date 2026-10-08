window.googletag = window.googletag || { cmd: [] };

googletag.cmd.push(function () {
  if (window.matchMedia("(min-width: 1351px)").matches) {
    googletag
      .defineSlot("/6355419/Travel/Europe/France/Paris", [160, 600], "ad-slot-left")
      .addService(googletag.pubads());
    googletag.enableServices();
    googletag.display("ad-slot-left");
  }
});