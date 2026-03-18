// 天气服务 - 深圳大鹏东山地区
const WEATHER_CONFIG = {
  // 深圳大鹏新区经纬度
  latitude: 22.5631,
  longitude: 114.5305,
  location: '深圳大鹏东山'
};

// 天气图标映射
const WEATHER_ICONS = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '小雨': '🌧️',
  '中雨': '🌧️',
  '大雨': '⛈️',
  '雷阵雨': '⚡',
  '雪': '❄️',
  '雾': '🌫️',
  '风': '💨'
};

// 获取天气数据（使用和风天气免费 API）
// 注意：需要申请 API key，这里使用模拟数据 + 真实接口框架
async function getWeather() {
  try {
    // 方案 1: 使用微信小程序天气插件（需要配置）
    // 方案 2: 使用腾讯天气 API
    // 方案 3: 使用和风天气 API
    
    // 这里先使用模拟数据，实际部署时替换为真实 API
    const mockWeather = getMockWeather();
    return {
      success: true,
      data: mockWeather
    };
    
    // 真实 API 调用示例（需要 API key）:
    /*
    const apiKey = 'YOUR_HEWEATHER_API_KEY';
    const url = `https://devapi.qweather.com/v7/weather/now?location=${WEATHER_CONFIG.longitude},${WEATHER_CONFIG.latitude}&key=${apiKey}`;
    
    const res = await wx.request({
      url: url,
      method: 'GET'
    });
    
    if (res.statusCode === 200 && res.data.code === '200') {
      return {
        success: true,
        data: parseWeatherData(res.data.now)
      };
    }
    */
  } catch (e) {
    console.error('获取天气失败:', e);
    return {
      success: false,
      error: e
    };
  }
}

// 模拟天气数据（根据日期生成，每天不同）
function getMockWeather() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // 根据日期生成"随机"但固定的天气（同一天查询结果相同）
  const weatherTypes = ['晴', '多云', '阴', '小雨'];
  const weatherIndex = dayOfYear % weatherTypes.length;
  const weather = weatherTypes[weatherIndex];
  
  // 温度根据季节变化
  const month = today.getMonth() + 1;
  let baseTemp = 20;
  if (month >= 6 && month <= 9) {
    baseTemp = 28 + (dayOfYear % 5); // 夏季
  } else if (month >= 12 || month <= 2) {
    baseTemp = 15 + (dayOfYear % 8); // 冬季
  } else {
    baseTemp = 22 + (dayOfYear % 6); // 春秋
  }
  
  // 风力
  const windLevels = ['1-2 级', '2-3 级', '3-4 级', '4-5 级'];
  const windLevel = windLevels[dayOfYear % windLevels.length];
  
  return {
    location: WEATHER_CONFIG.location,
    temp: baseTemp,
    weather: weather,
    weatherIcon: WEATHER_ICONS[weather] || '🌤️',
    wind: windLevel,
    humidity: 60 + (dayOfYear % 30), // 湿度 60-90%
    updateTime: today.toLocaleString('zh-CN')
  };
}

// 解析和风天气数据
function parseWeatherData(weatherData) {
  return {
    location: WEATHER_CONFIG.location,
    temp: parseInt(weatherData.temp),
    weather: weatherData.text,
    weatherIcon: WEATHER_ICONS[weatherData.text] || '🌤️',
    wind: weatherData.windScale + '级',
    humidity: parseInt(weatherData.humidity),
    updateTime: new Date().toLocaleString('zh-CN')
  };
}

module.exports = {
  getWeather,
  WEATHER_CONFIG
};
