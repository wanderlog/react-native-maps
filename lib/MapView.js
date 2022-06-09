"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableLatestRenderer = exports.AnimatedMapView = exports.MAP_TYPES = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const decorateMapComponent_1 = require("./decorateMapComponent");
const ProviderConstants = __importStar(require("./ProviderConstants"));
exports.MAP_TYPES = {
    STANDARD: 'standard',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain',
    NONE: 'none',
    MUTEDSTANDARD: 'mutedStandard',
};
const GOOGLE_MAPS_ONLY_TYPES = [exports.MAP_TYPES.TERRAIN, exports.MAP_TYPES.NONE];
class MapView extends React.Component {
    static Animated;
    map;
    __lastRegion;
    __layoutCalled;
    constructor(props) {
        super(props);
        this.map = React.createRef();
        this.state = {
            isReady: react_native_1.Platform.OS === 'ios',
        };
        this._onMapReady = this._onMapReady.bind(this);
        this._onChange = this._onChange.bind(this);
        this._onLayout = this._onLayout.bind(this);
    }
    setNativeProps(props) {
        this.map.current?.setNativeProps(props);
    }
    getSnapshotBeforeUpdate(prevProps) {
        if (this.state.isReady &&
            this.props.customMapStyle !== prevProps.customMapStyle) {
            this._updateStyle(this.props.customMapStyle);
        }
        return this.props.region || null;
    }
    componentDidUpdate(_prevProps, _prevState, region) {
        const a = this.__lastRegion;
        const b = region;
        if (!a || !b) {
            return;
        }
        if (a.latitude !== b.latitude ||
            a.longitude !== b.longitude ||
            a.latitudeDelta !== b.latitudeDelta ||
            a.longitudeDelta !== b.longitudeDelta) {
            this.map.current?.setNativeProps({ region: b });
        }
    }
    componentDidMount() {
        const { isReady } = this.state;
        if (isReady) {
            this._updateStyle(this.props.customMapStyle);
        }
    }
    _updateStyle(customMapStyle) {
        this.map.current?.setNativeProps({
            customMapStyleString: JSON.stringify(customMapStyle),
        });
    }
    _onMapReady() {
        const { region, initialRegion, onMapReady } = this.props;
        if (region) {
            this.map.current?.setNativeProps({ region });
        }
        else if (initialRegion) {
            this.map.current?.setNativeProps({ initialRegion });
        }
        this._updateStyle(this.props.customMapStyle);
        this.setState({ isReady: true }, () => {
            if (onMapReady) {
                onMapReady();
            }
        });
    }
    _onLayout(e) {
        const { layout } = e.nativeEvent;
        if (!layout.width || !layout.height) {
            return;
        }
        if (this.state.isReady && !this.__layoutCalled) {
            const { region, initialRegion } = this.props;
            if (region) {
                this.__layoutCalled = true;
                this.map.current?.setNativeProps({ region });
            }
            else if (initialRegion) {
                this.__layoutCalled = true;
                this.map.current?.setNativeProps({ initialRegion });
            }
        }
        if (this.props.onLayout) {
            this.props.onLayout(e);
        }
    }
    _onChange({ nativeEvent }) {
        this.__lastRegion = nativeEvent.region;
        const isGesture = nativeEvent.isGesture;
        const details = { isGesture };
        if (nativeEvent.continuous) {
            if (this.props.onRegionChange) {
                this.props.onRegionChange(nativeEvent.region, details);
            }
        }
        else if (this.props.onRegionChangeComplete) {
            this.props.onRegionChangeComplete(nativeEvent.region, details);
        }
    }
    getCamera() {
        if (react_native_1.Platform.OS === 'android') {
            return react_native_1.NativeModules.AirMapModule.getCamera(this._getHandle());
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return this._runCommand('getCamera', []);
        }
        return Promise.reject('getCamera not supported on this platform');
    }
    setCamera(camera) {
        this._runCommand('setCamera', [camera]);
    }
    animateCamera(camera, opts) {
        this._runCommand('animateCamera', [camera, opts ? opts.duration : 500]);
    }
    animateToRegion(region, duration = 500) {
        this._runCommand('animateToRegion', [region, duration]);
    }
    fitToElements(options = {}) {
        const { edgePadding = { top: 0, right: 0, bottom: 0, left: 0 }, animated = true, } = options;
        this._runCommand('fitToElements', [edgePadding, animated]);
    }
    fitToSuppliedMarkers(markers, options = {}) {
        const { edgePadding = { top: 0, right: 0, bottom: 0, left: 0 }, animated = true, } = options;
        this._runCommand('fitToSuppliedMarkers', [markers, edgePadding, animated]);
    }
    fitToCoordinates(coordinates = [], options = {}) {
        const { edgePadding = { top: 0, right: 0, bottom: 0, left: 0 }, animated = true, } = options;
        this._runCommand('fitToCoordinates', [coordinates, edgePadding, animated]);
    }
    /**
     * Get visible boudaries
     *
     * @return Promise Promise with the bounding box ({ northEast: <LatLng>, southWest: <LatLng> })
     */
    async getMapBoundaries() {
        if (react_native_1.Platform.OS === 'android') {
            return await react_native_1.NativeModules.AirMapModule.getMapBoundaries(this._getHandle());
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return await this._runCommand('getMapBoundaries', []);
        }
        return Promise.reject('getMapBoundaries not supported on this platform');
    }
    setMapBoundaries(northEast, southWest) {
        this._runCommand('setMapBoundaries', [northEast, southWest]);
    }
    setIndoorActiveLevelIndex(activeLevelIndex) {
        this._runCommand('setIndoorActiveLevelIndex', [activeLevelIndex]);
    }
    /**
     * Takes a snapshot of the map and saves it to a picture
     * file or returns the image as a base64 encoded string.
     *
     * @param args Configuration options
     * @param [args.width] Width of the rendered map-view (when omitted actual view width is used).
     * @param [args.height] Height of the rendered map-view (when omitted actual height is used).
     * @param [args.region] Region to render (Only supported on iOS).
     * @param [args.format] Encoding format ('png', 'jpg') (default: 'png').
     * @param [args.quality] Compression quality (only used for jpg) (default: 1.0).
     * @param [args.result] Result format ('file', 'base64') (default: 'file').
     *
     * @return Promise Promise with either the file-uri or base64 encoded string
     */
    takeSnapshot(args) {
        // Sanitize inputs
        const config = {
            width: args.width || 0,
            height: args.height || 0,
            region: args.region || {},
            format: args.format || 'png',
            quality: args.quality || 1.0,
            result: args.result || 'file',
        };
        if (config.format !== 'png' && config.format !== 'jpg') {
            throw new Error('Invalid format specified');
        }
        if (config.result !== 'file' && config.result !== 'base64') {
            throw new Error('Invalid result specified');
        }
        // Call native function
        if (react_native_1.Platform.OS === 'android') {
            return react_native_1.NativeModules.AirMapModule.takeSnapshot(this._getHandle(), config);
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return new Promise((resolve, reject) => {
                this._runCommand('takeSnapshot', [
                    config.width,
                    config.height,
                    config.region,
                    config.format,
                    config.quality,
                    config.result,
                    (err, snapshot) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(snapshot);
                        }
                    },
                ]);
            });
        }
        return Promise.reject('takeSnapshot not supported on this platform');
    }
    /**
     * Convert a coordinate to address by using default Geocoder
     *
     * @param coordinate Coordinate
     * @param [coordinate.latitude] Latitude
     * @param [coordinate.longitude] Longitude
     *
     * @return Promise with return type Address
     */
    addressForCoordinate(coordinate) {
        if (react_native_1.Platform.OS === 'android') {
            return react_native_1.NativeModules.AirMapModule.getAddressFromCoordinates(this._getHandle(), coordinate);
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return this._runCommand('getAddressFromCoordinates', [coordinate]);
        }
        return Promise.reject('getAddress not supported on this platform');
    }
    /**
     * Convert a map coordinate to user-space point
     *
     * @param coordinate Coordinate
     * @param [coordinate.latitude] Latitude
     * @param [coordinate.longitude] Longitude
     *
     * @return Promise Promise with the point ({ x: Number, y: Number })
     */
    pointForCoordinate(coordinate) {
        if (react_native_1.Platform.OS === 'android') {
            return react_native_1.NativeModules.AirMapModule.pointForCoordinate(this._getHandle(), coordinate);
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return this._runCommand('pointForCoordinate', [coordinate]);
        }
        return Promise.reject('pointForCoordinate not supported on this platform');
    }
    /**
     * Convert a user-space point to a map coordinate
     *
     * @param point Point
     * @param [point.x] X
     * @param [point.x] Y
     *
     * @return Promise Promise with the coordinate ({ latitude: Number, longitude: Number })
     */
    coordinateForPoint(point) {
        if (react_native_1.Platform.OS === 'android') {
            return react_native_1.NativeModules.AirMapModule.coordinateForPoint(this._getHandle(), point);
        }
        else if (react_native_1.Platform.OS === 'ios') {
            return this._runCommand('coordinateForPoint', [point]);
        }
        return Promise.reject('coordinateForPoint not supported on this platform');
    }
    /**
     * Get markers' centers and frames in user-space coordinates
     *
     * @param onlyVisible boolean true to include only visible markers, false to include all
     *
     * @return Promise Promise with { <identifier>: { point: Point, frame: Frame } }
     */
    getMarkersFrames(onlyVisible = false) {
        if (react_native_1.Platform.OS === 'ios') {
            return this._runCommand('getMarkersFrames', [onlyVisible]);
        }
        return Promise.reject('getMarkersFrames not supported on this platform');
    }
    /**
     * Get bounding box from region
     *
     * @param region Region
     *
     * @return Object Object bounding box ({ northEast: <LatLng>, southWest: <LatLng> })
     */
    boundingBoxForRegion(region) {
        return {
            northEast: {
                latitude: region.latitude + region.latitudeDelta / 2,
                longitude: region.longitude + region.longitudeDelta / 2,
            },
            southWest: {
                latitude: region.latitude - region.latitudeDelta / 2,
                longitude: region.longitude - region.longitudeDelta / 2,
            },
        };
    }
    _uiManagerCommand(name) {
        const componentName = (0, decorateMapComponent_1.getNativeMapName)(this.props.provider);
        return react_native_1.UIManager.getViewManagerConfig(componentName).Commands[name];
    }
    _mapManagerCommand(name) {
        return react_native_1.NativeModules[`${(0, decorateMapComponent_1.getNativeMapName)(this.props.provider)}Manager`][name];
    }
    _getHandle() {
        return (0, react_native_1.findNodeHandle)(this.map.current);
    }
    _runCommand(name, args) {
        switch (react_native_1.Platform.OS) {
            case 'android':
                return react_native_1.UIManager.dispatchViewManagerCommand(this._getHandle(), this._uiManagerCommand(name), args);
            case 'ios':
                return this._mapManagerCommand(name)(this._getHandle(), ...args);
            default:
                return Promise.reject(`Invalid platform was passed: ${react_native_1.Platform.OS}`);
        }
    }
    render() {
        let props;
        if (this.state.isReady) {
            props = {
                region: null,
                initialRegion: null,
                onChange: this._onChange,
                onMapReady: this._onMapReady,
                onLayout: this._onLayout,
                ref: this.map,
                ...this.props,
            };
            if (react_native_1.Platform.OS === 'ios' &&
                props.provider === ProviderConstants.PROVIDER_DEFAULT &&
                props.mapType &&
                GOOGLE_MAPS_ONLY_TYPES.includes(props.mapType)) {
                props.mapType = exports.MAP_TYPES.STANDARD;
            }
            if (props.onPanDrag) {
                props.handlePanDrag = !!props.onPanDrag;
            }
        }
        else {
            props = {
                style: this.props.style,
                region: null,
                initialRegion: this.props.initialRegion || null,
                ref: this.map,
                onChange: this._onChange,
                onMapReady: this._onMapReady,
                onLayout: this._onLayout,
            };
        }
        if (react_native_1.Platform.OS === 'android' && this.props.liteMode) {
            return (<decorateMapComponent_1.ProviderContext.Provider value={this.props.provider}>
          <AIRMapLite {...props}/>
        </decorateMapComponent_1.ProviderContext.Provider>);
        }
        const AIRMap = getNativeMapComponent(this.props.provider);
        return (<decorateMapComponent_1.ProviderContext.Provider value={this.props.provider}>
        <AIRMap {...props}/>
      </decorateMapComponent_1.ProviderContext.Provider>);
    }
}
const airMaps = {
    default: (0, react_native_1.requireNativeComponent)('AIRMap'),
    google: () => null,
};
if (react_native_1.Platform.OS === 'android') {
    airMaps.google = airMaps.default;
}
else {
    airMaps.google = decorateMapComponent_1.googleMapIsInstalled
        ? (0, react_native_1.requireNativeComponent)('AIRGoogleMap')
        : (0, decorateMapComponent_1.createNotSupportedComponent)('react-native-maps: AirGoogleMaps dir must be added to your xCode project to support GoogleMaps on iOS.');
}
const getNativeMapComponent = (provider) => airMaps[provider || 'default'];
const AIRMapLite = react_native_1.UIManager.getViewManagerConfig('AIRMapLite')
    ? (0, react_native_1.requireNativeComponent)('AIRMapLite')
    : () => null;
exports.AnimatedMapView = react_native_1.Animated.createAnimatedComponent(MapView);
const enableLatestRenderer = () => {
    if (react_native_1.Platform.OS !== 'android') {
        return;
    }
    return react_native_1.NativeModules.AirMapModule.enableLatestRenderer();
};
exports.enableLatestRenderer = enableLatestRenderer;
MapView.Animated = exports.AnimatedMapView;
exports.default = MapView;
