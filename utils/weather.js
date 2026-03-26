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

// 获取天气数据
async function getWeather() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cacheKey = `weatherCache_${today}`;
  
  // 1. 检查本地缓存（当天有效）
  try {
    const cached = wx.getStorageSync(cacheKey);
    if (cached) {
      console.log('[天气] 使用当天缓存数据');
      return {
        success: true,
        data: cached
      };
    }
  } catch (err) {
    console.warn('[天气] 读取缓存失败:', err);
  }
  
  // 2. 尝试真实API（如果有API密钥）
  const apiKey = getWeatherApiKey();
  if (apiKey) {
    try {
      const weatherData = await fetchWeatherFromAPI(apiKey);
      // 3. 缓存数据（当天有效）
      wx.setStorageSync(cacheKey, weatherData);
      return {
        success: true,
        data: weatherData
      };
    } catch (err) {
      console.warn('[天气] API获取失败，使用模拟数据:', err);
    }
  }
  
  // 4. 使用模拟数据（作为降级方案）
  const mockData = getMockWeather();
  // 同样缓存模拟数据，避免重复生成
  wx.setStorageSync(cacheKey, mockData);
  return {
    success: true,
    data: mockData
  };
}

// 获取天气API密钥（用户需要在此配置）
function getWeatherApiKey() {
  // 请在此处填入您的和风天气API密钥
  // 可以从 https://devapi.qweather.com/ 免费申请
  // const API_KEY = 'YOUR_API_KEY_HERE';
  const API_KEY = ''; // 留空表示不使用真实API
  
  return API_KEY || null;
}

// 从API获取天气数据
async function fetchWeatherFromAPI(apiKey) {
  const url = `https://devapi.qweather.com/v7/weather/now?location=${WEATHER_CONFIG.longitude},${WEATHER_CONFIG.latitude}&key=${apiKey}`;
  
  const res = await wx.request({
    url: url,
    method: 'GET',
    timeout: 5000 // 5秒超时
  });
  
  if (res.statusCode === 200 && res.data.code === '200') {
    return parseWeatherData(res.data.now);
  } else {
    throw new Error(`API请求失败: ${res.statusCode} ${res.data?.code || ''}`);
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
