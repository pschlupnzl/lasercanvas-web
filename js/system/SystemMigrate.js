/**
 * Methods for migrating data files of older versions.
 */
(function (LaserCanvas) {
	var CURRENT_VERSION = 1,
		migrations = [
			/** Migrate version 0 (non-versioned, system-dominant). */
			function fromVersion0(json) {
				if (!json.version
					&& !json.hasOwnProperty("system")
					&& json.hasOwnProperty("prop")
					&& json.hasOwnProperty("elements")) {
					json.system = {
						prop: json.prop,
						elements: json.elements
					};
					json.version = 1;
					delete json.prop;
					delete json.elements;
				}
				return json;
			}
		],

		/**
		 * Migrates old versions of the system JSON file, returning the data
		 * in the newest version.
		 * @param {object} json System data to be migrated.
		 */
		migrateJson = function (json) {
			for (var migration of migrations) {
				json = migration(json);
			}
			return json;
		};

	LaserCanvas.SystemUtil = LaserCanvas.SystemUtil || {};
	LaserCanvas.SystemUtil.migrateJson = migrateJson;
	/** Current version of data files being written. */
	LaserCanvas.SystemUtil.CURRENT_VERSION = CURRENT_VERSION;
}(window.LaserCanvas));
