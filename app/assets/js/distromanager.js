const { DistributionAPI } = require('helios-core/common')

const ConfigManager = require('./configmanager')

// Old WesterosCraft url.'
// exports.REMOTE_DISTRO_URL = 'https://worldofglory.eu/distribution.json'

exports.REMOTE_DISTRO_URL = 'http://188.245.52.87:5000/distribution.json'

const api = new DistributionAPI(
    ConfigManager.getLauncherDirectory(),
    null, // Injected forcefully by the preloader.
    null, // Injected forcefully by the preloader.
    exports.REMOTE_DISTRO_URL,
    false
)

exports.DistroAPI = api