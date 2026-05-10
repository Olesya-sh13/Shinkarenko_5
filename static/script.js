// Для отображения прогнозов в этом приложении есть:
// 1. Видео, которое показывает трансляцию с веб-камеры пользователя
// 2. Поверх видео отображается экран, на котором отображаются прогнозы
// При загрузке страницы пользователю предлагается разрешить использование веб-камеры.
// После этого модель инициализируется и начинает делать прогнозы
// При первом прогнозировании в detectFrame() выполняется шаг инициализации для подготовки холста, на котором отображаются прогнозы.


var bounding_box_colors = {};

var user_confidence = 0.6;

// Обновите цвета в этом списке, чтобы задать цвета ограничивающей рамки
var color_choices = [
  "#C7FC00",
  "#FF00FF",
  "#8622FF",
  "#FE0056",
  "#00FFCE",
  "#FF8000",
  "#00B7EB",
  "#FFFF00",
  "#0E7AFE",
  "#FFABAB",
  "#0000FF",
  "#CCCCCC",
];

var canvas_painted = false;
var canvas = document.getElementById("video_canvas"); // Элемент canvas, на котором отображаются прогнозы
var ctx = canvas.getContext("2d");

const inferEngine = new inferencejs.InferenceEngine(); // Создаем экземпляр движка вывода
var modelWorkerId = null; // Идентификатор рабочего процесса модели


function detectFrame() {
 // При первом запуске инициализируйте холст
 // При всех запусках выполняйте вывод с использованием видеокадра
 // Для каждого видеокадра нарисуйте ограничивающие рамки на холсте
  if (!modelWorkerId) return requestAnimationFrame(detectFrame); // Если модель не загружена, попробуйте снова

  inferEngine.infer(modelWorkerId, new inferencejs.CVImage(video)).then(function(predictions) {

    if (!canvas_painted) {
      var video_start = document.getElementById("video1"); // Элемент видео, который отображает трансляцию с веб-камеры пользователя

      canvas.top = video_start.top;
      canvas.left = video_start.left;
      canvas.style.top = video_start.top + "px";
      canvas.style.left = video_start.left + "px";
      canvas.style.position = "absolute";
      video_start.style.display = "block";
      canvas.style.display = "absolute";
      canvas_painted = true;

      var loading = document.getElementById("loading");
      loading.style.display = "none";
    }
    requestAnimationFrame(detectFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (video) {
      drawBoundingBoxes(predictions, ctx)
    }
  });
}

function drawBoundingBoxes(predictions, ctx) {
 // Для каждого прогноза выберите или назначьте цвет ограничивающей рамки,
 // затем примените необходимое масштабирование, чтобы ограничивающие рамки отображались точно вокруг предсказания.

 // Если вы хотите что-то сделать с прогнозами, начните с этой функции.
 // Например, вы могли бы отображать их на веб-странице, отмечать элементы в списке галочками 
 // или хранить прогнозы где-нибудь.

  for (var i = 0; i < predictions.length; i++) { 
    var confidence = predictions[i].confidence;

    console.log(user_confidence)

    if (confidence < user_confidence) {
      continue
    }

    if (predictions[i].class in bounding_box_colors) {
      ctx.strokeStyle = bounding_box_colors[predictions[i].class];
    } else {
      var color =
        color_choices[Math.floor(Math.random() * color_choices.length)]; // Выберите случайный цвет
      ctx.strokeStyle = color;
      // Удалите цвет из списка цветов, чтобы он не использовался снова
      color_choices.splice(color_choices.indexOf(color), 1);

      bounding_box_colors[predictions[i].class] = color;
    }

    var prediction = predictions[i];
    var x = prediction.bbox.x - prediction.bbox.width / 2;  // x-координата верхнего левого угла ограничивающей рамки
    var y = prediction.bbox.y - prediction.bbox.height / 2; // y-координата верхнего левого угла ограничивающей рамки
    var width = prediction.bbox.width;
    var height = prediction.bbox.height;

    ctx.rect(x, y, width, height);

    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    ctx.strokeRect(x, y, width, height);
    ctx.font = "25px Arial"; 
    ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10); // Надпись с именем класса и уверенностью
  }
}

function webcamInference() {
  // Запрашиваем разрешение на использование веб-камеры пользователя
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
      video = document.createElement("video");
      video.srcObject = stream;
      video.id = "video1";

      // скрыть элемент видео
      video.style.display = "none";
      video.setAttribute("playsinline", "");

      document.getElementById("video_canvas").after(video);

      video.onloadedmetadata = function() {
        video.play();
      }

      // Установите высоту и ширину видео и холста
      video.onplay = function() {
        height = video.videoHeight;
        width = video.videoWidth;

        // Если видео не горизонтальное, переверните его

        video.width = width;
        video.height = height;
        video.style.width = 640 + "px";
        video.style.height = 480 + "px";

        canvas.style.width = 640 + "px";
        canvas.style.height = 480 + "px";
        canvas.width = width;
        canvas.height = height;

        document.getElementById("video_canvas").style.display = "block";
      };

      ctx.scale(1, 1);

    // Загрузите модель Roboflow, используя параметр publishable_key, указанный в index.html
    // , а также название модели и версию, указанные в верхней части этого файла
      inferEngine.startWorker(MODEL_NAME, MODEL_VERSION, publishable_key, [{ scoreThreshold: CONFIDENCE_THRESHOLD }])
        .then((id) => {
          modelWorkerId = id;
          // Запустите цикл вывода
          detectFrame();
        });
    })
    .catch(function(err) {
      console.log(err);
    });
}

function changeConfidence () {
  user_confidence = document.getElementById("confidence").value / 100;
}

document.getElementById("confidence").addEventListener("input", changeConfidence);

webcamInference();