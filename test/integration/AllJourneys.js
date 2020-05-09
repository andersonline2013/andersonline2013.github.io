sap.ui.define([
  "sap/ui/test/Opa5",
  "covid/test/integration/arrangements/Startup",
  "covid/test/integration/BasicJourney"
], function(Opa5, Startup) {
  "use strict";

  Opa5.extendConfig({
    arrangements: new Startup(),
    pollingInterval: 1
  });

});
