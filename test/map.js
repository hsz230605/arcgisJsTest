//已合并。
//此文件废弃

function mapInit() {
    //mapDataUrl: 含有地图信息的url
    var mapDataUrl='http://172.28.76.22/onemapsrv/mapview?appid=sipbwmap&xusername=yqgh';
    $.ajax(mapDataUrl).done(function (response) {
        //初始化Map
        creatMap(response);
        //从地图服务获取所有底图并加入map
        addBase(response);
        //getTiledMaps(response);
        //创建搜索结果展示图层
        addLayer();
    });

    function creatMap(response) {
        //console.log(response);
        require(["esri/map", "esri/geometry/Point", "esri/SpatialReference", "esri/geometry/Extent", "dojo/domReady!test/map"],
            function (Map, Point, SpatialReference, Extent) {
                //根据返回结果配置map
                var extent = response.data.defaultMapExtent.split(',');
                var sr = new SpatialReference(response.data.spatialReference);
                //配置map
                map = new Map("map", {
                    zoom: 6,
                    extent: new Extent(parseFloat(extent[0]), parseFloat(extent[1])
                        , parseFloat(extent[2]), parseFloat(extent[3]), sr),
                    maxScale:2000

                });
            })
    }

    /*已废弃 循环调用版本原因：复杂*/
    //从地图服务获取所有底图并加入map
    // function getTiledMaps(response) {
    //     for(var i=0;i<response.data.baseMap.length;i++){
    //         var data=response.data
    //             ,mapUrl=data.baseMap[i].serviceUrl
    //             ,tokenName=data.baseMap[i].tokenName;
    //         //根据data.basemap.tokenname，在data.token中查询获取地图对应token 拼url
    //         //console.log('获取地图对应token 拼url');
    //         for(var index in data.token){
    //             if(data.token[index].name==tokenName){
    //                 $.ajax({
    //                     url:data.token[index].url,
    //                     async: false}
    //                 ).done(function (responseToken) {
    //                     //console.log(mapUrl);
    //                     mapUrl += '?token=' + responseToken;
    //                 })
    //             }
    //         }
    //         /*将第index个切片地图加入map */
    //         addTileToMap(i,mapUrl);
    //     }
    // }
    // /*将第index个切片地图加入map */
    // function addTileToMap(index,mapUrl) {
    //     require(["esri/map","esri/layers/ArcGISTiledMapServiceLayer"],
    //         function(Map, ArcGISTiledMapServiceLayer) {
    //             var tiled = new ArcGISTiledMapServiceLayer(mapUrl);
    //             tiled.id=mapId[index];
    //             //默认显示第一个,其他隐藏
    //             if(index!=0){tiled.visible=false;}
    //             map.addLayer(tiled);
    //         }
    //     );
    // }
    //添加用于展示搜索结果的图层
    function addLayer() {
        require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
            map.addLayer(new GraphicsLayer({
                id:shapeLayerId
            }));
            map.addLayer(new GraphicsLayer({
                id:iconLayerId
            }))
        });
    }

    /*简化版*/
    function addBase(response) {
        getTileMap(response,0);
        getTileMap(response,1);
    }
    function getTileMap(response,index) {
        var tileMap = response.data.baseMap[index]
            ,token =response.data.token
            ,url= tileMap.serviceUrl+"?token=";
        for(var i in token){
            if(token[i].name==tileMap.tokenName){
                url += getToken(token[i].url);
            }
        }
        //添加切片图层到map
        require(["esri/map","esri/layers/ArcGISTiledMapServiceLayer"],
            function(Map, ArcGISTiledMapServiceLayer) {
                var tiled = new ArcGISTiledMapServiceLayer(url);
                tiled.id=mapId[index];
                //默认显示第一个,其他隐藏
                if(index!=0){tiled.visible=false;}
                map.addLayer(tiled);
            }
        );
    }
    //获取token
    function getToken(url) {
        var token="";
        $.ajax({
            url:url,
            async: false}
        ).done(function (responseToken) {
            token=responseToken;
        });
        return token
    }
}

//切换按钮图片
function toggleBtn(jquery) {
    //jquery: $(this)
    //为被选中的按钮添加class:"this"
    if (!jquery.hasClass("this")) {
        jquery.siblings().removeClass("this");
        jquery.addClass("this");
    }
    //含有class:"this"的显示含有"2"的图片，未被选中的显示含有"1"的图片
    togglePic();
    function togglePic() {
        $(".toggle img").attr("src", function (index, value) {
            if ($(this).parent().hasClass("this")) {
                return value.replace("1", "2");
            }
            return value.replace("2", "1");
        });
    }
}
/*底图切换按钮*/
$('.toggle .base1').click(function () {
    if(!map.getLayer(mapId[0]).visible){
        map.getLayer(mapId[1]).hide();
        map.getLayer(mapId[0]).show();
    }
    toggleBtn($(this));

});
$(".toggle .base2").click(function () {
    if(!map.getLayer(mapId[1]).visible){
        map.getLayer(mapId[0]).hide();
        map.getLayer(mapId[1]).show();
    }
    toggleBtn($(this));
});
//test
$('.toggle .test').click(function () {
    require([
        "esri/geometry/Point","esri/layers/GraphicsLayer",
        "esri/symbols/PictureMarkerSymbol", "esri/symbols/SimpleLineSymbol",
        "esri/Color", "esri/graphic","esri/InfoTemplate","esri/geometry/Polygon"
        ,"esri/symbols/SimpleFillSymbol","esri/SpatialReference","esri/dijit/InfoWindow"
        ,"dojo/dom-construct"
    ], function (Point,GraphicsLayer,PictureMarkerSymbol,
                 SimpleLineSymbol, Color, Graphic,InfoTemplate,Polygon
                ,SimpleFillSymbol,SpatialReference,InfoWindow,domConstruct ) {
        var pt = new Point(64533.3,47509.0,map.spatialReference);
        var template = new InfoTemplate("1111","1111111111");
        var graphicsLayer = new GraphicsLayer({infoTemplate: template});
        map.infoWindow.setTitle('11');
        map.infoWindow.setContent("22");
        map.infoWindow.show(pt);
        map.centerAt(pt);
    });
});
/*config*/
var map;
var mapId=["baseLayer","baseLayerImg"]//几个底图添加几条，具体名字随便起
    ,shapeLayerId = "landLayer"
    ,iconLayerId = "iconLayer";
mapInit();

/*下面测试用*/
// dojo.require("esri.map");
// function init(map){
//
//     dojo.connect(map,"onLoad",function(){
//         //地图加载后，监听到鼠标移动或拖动事件
//         dojo.connect(map,"onMouseMove",showCoordinates);
//         dojo.connect(map,"onMouseDrag",showCoordinates);
//     });
//
//
// }
// //显示坐标的回调函数，参数是evt
// function showCoordinates(evt){
//     //从事件中获取mapPoint
//     var mp = evt.mapPoint;
//     //显示鼠标坐标
//     dojo.byId("info").innerHTML = mp.x + "," + mp.y;
// }
//
// dojo.addOnLoad(init(map));

//features为graphic的数组